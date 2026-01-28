import fs from 'fs';
import path from 'path';

const SAMPLES_DIR = 'samples';
const OUTPUT_FILE = 'data/videos.json';

// Mapping helpers
const BENCHMARKS = {
  'PhyGenBench': {
    type: 'flat',
    promptFile: 'phygenbench.txt',
    models: ['wan', 'cogvideox']
  },
  'Physics-IQ': {
    type: 'categorized',
    promptFile: 'physics-iq.txt',
    models: ['wan', 'cogvideox']
  }
};

function getModelFromFilename(filename) {
  if (filename.includes('_v9_lowfreq')) return 'wan';
  if (filename.includes('_v9_s005')) return 'cogvideox';
  if (filename.toLowerCase().includes('wan')) return 'wan';
  if (filename.toLowerCase().includes('cogvideox')) return 'cogvideox';
  return null;
}

function getTypeFromFilename(filename) {
  if (filename.includes('[BASE]')) return 'base';
  if (filename.includes('[OURS]')) return 'ours';
  return null;
}

function loadPrompts(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').map(line => line.trim());
  } catch (e) {
    console.error(`Error reading prompts from ${filePath}:`, e);
    return [];
  }
}

function scanSamples() {
  const data = {
    benchmarks: []
  };

  for (const [benchName, benchConfig] of Object.entries(BENCHMARKS)) {
    const benchPath = path.join(SAMPLES_DIR, benchName);
    if (!fs.existsSync(benchPath)) {
      console.warn(`Benchmark directory not found: ${benchPath}`);
      continue;
    }

    const prompts = loadPrompts(path.join(SAMPLES_DIR, benchConfig.promptFile));
    const benchData = {
      id: benchName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      title: benchName,
      type: benchConfig.type,
      models: []
    };

    // Initialize models
    const modelMap = {};
    benchConfig.models.forEach(m => {
      modelMap[m] = {
        id: m,
        title: m === 'wan' ? 'Wan' : 'CogVideoX',
        samples: {} // key: sampleId, value: { id, prompt, base, ours }
      };
      
      if (benchConfig.type === 'categorized') {
        modelMap[m].categories = {}; // key: categoryName, value: [samples]
      }
    });

    if (benchConfig.type === 'flat') {
      const files = fs.readdirSync(benchPath).filter(f => f.endsWith('.mp4'));
      files.forEach(file => {
        const model = getModelFromFilename(file);
        const type = getTypeFromFilename(file);
        const match = file.match(/^(\d+)_/);
        
        if (model && type && match) {
          const id = parseInt(match[1]); // 1-based index
          // PhyGenBench prompts are 1-indexed
          const prompt = prompts[id - 1] || "Prompt not found";
          
          if (!modelMap[model].samples[id]) {
            modelMap[model].samples[id] = { id: id.toString(), prompt, base: null, ours: null };
          }
          modelMap[model].samples[id][type] = path.join(SAMPLES_DIR, benchName, file);
        }
      });
    } else if (benchConfig.type === 'categorized') {
      const categories = fs.readdirSync(benchPath).filter(f => fs.statSync(path.join(benchPath, f)).isDirectory());
      
      categories.forEach(cat => {
        const catPath = path.join(benchPath, cat);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.mp4'));
        
        files.forEach(file => {
          const model = getModelFromFilename(file);
          const type = getTypeFromFilename(file);
          const match = file.match(/^(\d+)_/);
          
          if (model && type && match) {
            const idStr = match[1];
            const id = parseInt(idStr, 10);
            const prompt = prompts[id - 1] || "Prompt not found";
            
            // For categorized, we need to structure it differently or just add category metadata
            if (!modelMap[model].samples[id]) {
              modelMap[model].samples[id] = { 
                id: idStr, // Keep zero padding for display if desired, or normalized
                prompt, 
                category: cat,
                base: null, 
                ours: null 
              };
            }
            modelMap[model].samples[id][type] = path.join(SAMPLES_DIR, benchName, cat, file);
          }
        });
      });
    }

    // Convert objects to arrays and sort
    benchData.models = Object.values(modelMap).map(m => {
      const samples = Object.values(m.samples).sort((a, b) => parseInt(a.id) - parseInt(b.id));
      
      if (benchConfig.type === 'categorized') {
        // Group by category for rendering
        const cats = {};
        samples.forEach(s => {
          if (!cats[s.category]) cats[s.category] = [];
          cats[s.category].push(s);
        });
        
        return {
          id: m.id,
          title: m.title,
          categories: Object.entries(cats).map(([k, v]) => ({ name: k, samples: v })).sort((a, b) => a.name.localeCompare(b.name))
        };
      } else {
        return {
          id: m.id,
          title: m.title,
          samples: samples
        };
      }
    });

    data.benchmarks.push(benchData);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`Generated ${OUTPUT_FILE}`);
}

scanSamples();
