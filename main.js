document.addEventListener('DOMContentLoaded', () => {
  const contentDiv = document.getElementById('content');

  fetch('data/videos.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      contentDiv.innerHTML = '';

      if (!data.benchmarks || data.benchmarks.length === 0) {
        contentDiv.innerHTML = '<p>No content available.</p>';
        return;
      }

      data.benchmarks.forEach(benchmark => {
        if (benchmark.id === 'phygenbench') {
          const priorityIds = ['34', '70', '122'];
          const hasPriority = (model) =>
            Array.isArray(model.samples) && model.samples.some(sample => priorityIds.includes(sample.id));

          benchmark.models.forEach(model => {
            if (model.samples) {
              model.samples.sort((a, b) => {
                const indexA = priorityIds.indexOf(a.id);
                const indexB = priorityIds.indexOf(b.id);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return 0;
              });
            }
          });

          benchmark.models.sort((a, b) => {
            const aHas = hasPriority(a);
            const bHas = hasPriority(b);
            if (aHas === bHas) return 0;
            return aHas ? -1 : 1;
          });
        }

        if (benchmark.id === 'physics-iq') {
          benchmark.type = 'flat'; 
          benchmark.models.forEach(model => {
            if (model.categories) {
              const allSamples = [];
              model.categories.forEach(cat => {
                if (cat.samples) allSamples.push(...cat.samples);
              });
              model.samples = shuffleArray(allSamples);
              delete model.categories;
            }
          });
        }
      });

      data.benchmarks.forEach((benchmark, index) => {
        const sectionElement = createBenchmarkSection(benchmark, index);
        contentDiv.appendChild(sectionElement);
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      contentDiv.innerHTML = '<p>Error loading content. Please ensure you are running this on a local server.</p>';
    });
});

function createBenchmarkSection(benchmark, index) {
  const section = document.createElement('div');
  section.className = 'benchmark-section';
  section.style.animationDelay = `${index * 0.1}s`;
  
  const title = document.createElement('h2');
  title.className = 'benchmark-title';
  title.textContent = benchmark.title;
  section.appendChild(title);

  benchmark.models.forEach(model => {
    const modelDiv = document.createElement('div');
    modelDiv.className = 'model-section';
    
    if (benchmark.type === 'categorized' && model.categories) {
      model.categories.forEach(category => {
        const grid = document.createElement('div');
        grid.className = 'grid';
        
        category.samples.forEach(sample => {
          grid.appendChild(createComparisonCard(sample));
        });
        
        modelDiv.appendChild(grid);
      });
    } else {
      const grid = document.createElement('div');
      grid.className = 'grid';
      
      model.samples.forEach(sample => {
        grid.appendChild(createComparisonCard(sample));
      });
      
      modelDiv.appendChild(grid);
    }
    
    section.appendChild(modelDiv);
  });

  return section;
}

function createComparisonCard(sample) {
  const card = document.createElement('div');
  card.className = 'comp-card';

  const header = document.createElement('div');
  header.className = 'comp-header';
  
  const prompt = document.createElement('div');
  prompt.className = 'comp-prompt';
  prompt.textContent = sample.prompt;
  
  const meta = document.createElement('div');
  meta.className = 'comp-meta';
  
  header.appendChild(prompt);
  header.appendChild(meta);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'comp-body';

  const baseWrapper = createVideoWrapper(sample.base, 'Baseline');
  const oursWrapper = createVideoWrapper(sample.ours, 'PhaseLock (Ours)');

  body.appendChild(baseWrapper);
  body.appendChild(oursWrapper);

  const baseVideo = baseWrapper.querySelector('video');
  const oursVideo = oursWrapper.querySelector('video');
  syncVideos(baseVideo, oursVideo);

  card.appendChild(body);
  return card;
}

function createVideoWrapper(src, labelText) {
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const label = document.createElement('div');
  label.className = 'video-label';
  label.textContent = labelText;
  wrapper.appendChild(label);

  const container = document.createElement('div');
  container.className = 'video-container';

  if (src && src !== '') {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.muted = true;

    const source = document.createElement('source');
    source.src = src;
    source.type = src.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    
    video.appendChild(source);
    
    video.onerror = () => {
      container.innerHTML = '';
      container.appendChild(createPlaceholder('Media Unavailable'));
    };

    container.appendChild(video);
  } else {
    container.appendChild(createPlaceholder('Not Available'));
  }

  wrapper.appendChild(container);
  return wrapper;
}

function createPlaceholder(text) {
  const div = document.createElement('div');
  div.className = 'video-placeholder';
  div.textContent = text;
  return div;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function syncVideos(video1, video2) {
  if (!video1 || !video2) return;
  
  let isSyncing = false;
  const events = ['play', 'pause', 'seeking', 'seeked'];
  
  function sync(e, other) {
    if (isSyncing) return;
    isSyncing = true;
    
    if (e.type === 'play') {
      other.play().catch(() => {});
    } else if (e.type === 'pause') {
      other.pause();
    } else if (e.type === 'seeking' || e.type === 'seeked') {
      if (Math.abs(other.currentTime - e.target.currentTime) > 0.1) {
        other.currentTime = e.target.currentTime;
      }
    }
    
    setTimeout(() => { isSyncing = false; }, 50);
  }

  events.forEach(evt => {
    video1.addEventListener(evt, (e) => sync(e, video2));
    video2.addEventListener(evt, (e) => sync(e, video1));
  });
}
