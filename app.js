// TMDB API Configuration
const TMDB_API_KEY = 'b9cd4ee40ca04611f564a0127bfbea03';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const moviesContainer = document.getElementById("movies");
let currentPage = 1;
let totalPages = 1;
let searchQuery = '';

// Fetch movies from TMDB
async function fetchMovies(page = 1, query = '') {
  try {
    let url;
    if (query) {
      url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    } else {
      url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch movies');
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Fetch movie videos/trailers
async function fetchMovieVideos(movieId) {
  try {
    const url = `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return { results: [] };
  }
}

function renderMovieCard(movie) {
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  const rating = movie.vote_average || 0;
  const ratingPercent = Math.round(rating * 10);
  
  return `
    <article class="movie-card" data-movie-id="${movie.id}">
      <div class="poster-container">
        <img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster" loading="lazy">
        <div class="rating-badge">${ratingPercent}%</div>
        <div class="movie-overlay">
          <button class="watch-btn" onclick="openMoviePlayer(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
            <span>▶</span> Watch Now
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-meta">${movie.release_date?.split('-')[0] || 'N/A'}</p>
        <p class="movie-description">${movie.overview || 'No description available.'}</p>
      </div>
    </article>
  `;
}

async function renderMovies(page = 1) {
  try {
    currentPage = page;
    moviesContainer.innerHTML = '<div class="loading">⏳ Loading movies...</div>';
    
    const data = await fetchMovies(page, searchQuery);
    totalPages = data.total_pages;
    const movies = data.results.filter(m => m.poster_path);
    
    if (movies.length === 0) {
      moviesContainer.innerHTML = '<div class="error-state"><h3>No movies found</h3><p>Try a different search term</p></div>';
      return;
    }
    
    moviesContainer.innerHTML = movies.map(renderMovieCard).join('');
    updatePagination();
  } catch (error) {
    moviesContainer.innerHTML = `
      <div class="error-state">
        <h3>⚠️ Unable to load movies</h3>
        <p>Please check your connection or try again later.</p>
        <button onclick="renderMovies(1)">Retry</button>
      </div>
    `;
    console.error('Failed to render movies', error);
  }
}

function updatePagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) return;
  
  let html = '';
  
  if (currentPage > 1) {
    html += `<button class="page-btn" onclick="renderMovies(1)">« First</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${currentPage - 1})">‹ Prev</button>`;
  }
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<button class="page-btn active">${i}</button>`;
    } else {
      html += `<button class="page-btn" onclick="renderMovies(${i})">${i}</button>`;
    }
  }
  
  if (currentPage < totalPages) {
    html += `<button class="page-btn" onclick="renderMovies(${currentPage + 1})">Next ›</button>`;
    html += `<button class="page-btn" onclick="renderMovies(${totalPages})">Last »</button>`;
  }
  
  paginationContainer.innerHTML = html;
}

async function openTrailer(movieId, title) {
  try {
    const videoData = await fetchMovieVideos(movieId);
    const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    
    if (trailer && trailer.key) {
      showTrailerModal(title, trailer.key);
    } else {
      alert(`🎬 No trailer available for "${title}"\n\nBut the movie is available on TMDB!`);
    }
  } catch (error) {
    console.error('Error loading trailer:', error);
    alert('Unable to load trailer. Please try again.');
  }
}

function showTrailerModal(title, youtubeKey) {
  const modal = document.getElementById('trailer-modal');
  const modalTitle = document.getElementById('modal-title');
  const videoFrame = document.getElementById('video-frame');
  
  modalTitle.textContent = title;
  videoFrame.src = `https://www.youtube.com/embed/${youtubeKey}?autoplay=1`;
  modal.style.display = 'block';
}

function closeTrailerModal() {
  const modal = document.getElementById('trailer-modal');
  const videoFrame = document.getElementById('video-frame');
  modal.style.display = 'none';
  videoFrame.src = '';
}

// Fetch free movies from Internet Archive
async function searchFreeMovies(title) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=title:%22${encodeURIComponent(title)}%22%20AND%20mediatype:movies&fl=identifier,title,description,format&output=json&rows=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to search Internet Archive');
    return response.json();
  } catch (error) {
    console.error('Error searching free movies:', error);
    return { response: { docs: [] } };
  }
}

// Generate links to legal streaming services
function generateStreamingLinks(title, year) {
  const encodedTitle = encodeURIComponent(title);
  
  return {
    netflix: `https://www.netflix.com/search?q=${encodedTitle}`,
    prime: `https://www.amazon.com/s?k=${encodedTitle}`,
    disney: `https://www.disneyplus.com/search?q=${encodedTitle}`,
    hotstar: `https://www.hotstar.com/search?query=${encodedTitle}`,
    sonyliv: `https://www.sonyliv.com/search/${encodedTitle}`,
    sunnxt: `https://www.sunnxt.com/search/${encodedTitle}`,
    tubi: `https://tubitv.com/search?q=${encodedTitle}`,
    archive: `https://archive.org/advancedsearch.php?q=title:%22${encodedTitle}%22&mediatype=movies`
  };
}

function openMoviePlayer(movieId, title) {
  // Directly show streaming options without YouTube trailers
  showStreamingOptions(movieId, title);
}

function showStreamingOptions(movieId, title) {
  const modal = document.getElementById('streaming-modal');
  const modalTitle = document.getElementById('streaming-title');
  const optionsContent = document.getElementById('streaming-options');
  
  optionsContent.innerHTML = `
    <div class="loading-spinner">
      <p>🔍 Finding available streams...</p>
    </div>
  `;
  
  modalTitle.textContent = title;
  modal.style.display = 'block';
  
  // Get streaming links
  const links = generateStreamingLinks(title);
  
  // Build streaming options UI
  let html = '<div class="streams-list">';
  
  // Global Platforms
  html += '<h3 class="platform-category">🌍 Global Platforms</h3>';
  
  html += `
    <a href="${links.netflix}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">Netflix</h4>
        <p class="stream-source">Premium subscription required</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += `
    <a href="${links.prime}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">Amazon Prime Video</h4>
        <p class="stream-source">Prime subscription or rental</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += `
    <a href="${links.disney}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">Disney+</h4>
        <p class="stream-source">Premium subscription</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  // Indian Platforms
  html += '<h3 class="platform-category">🇮🇳 Indian & Tamil OTT</h3>';
  
  html += `
    <a href="${links.hotstar}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">Disney+ Hotstar</h4>
        <p class="stream-source">Hindi, Tamil, Telugu & more</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += `
    <a href="${links.sonyliv}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">SonyLiv</h4>
        <p class="stream-source">Hindi, Tamil, Marathi content</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += `
    <a href="${links.sunnxt}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">Sun NXT</h4>
        <p class="stream-source">Tamil, Telugu & South Indian</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  // Free Platforms
  html += '<h3 class="platform-category">✨ Free with Ads</h3>';
  
  html += `
    <a href="${links.tubi}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">🎬 Tubi TV</h4>
        <p class="stream-source">10,000+ Free Movies</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += `
    <a href="${links.archive}" target="_blank" rel="noopener noreferrer" class="stream-item">
      <div class="stream-info">
        <h4 class="stream-name">📚 Internet Archive</h4>
        <p class="stream-source">Public Domain & Creative Commons</p>
      </div>
      <div class="stream-action">→</div>
    </a>
  `;
  
  html += '</div>';
  
  // Add info footer
  html += `
    <div class="streaming-footer">
      <p>👆 Click any platform to search for this movie</p>
      <p style="font-size: 0.8rem; color: #707080;">All links are 100% legal and ad-supported</p>
    </div>
  `;
  
  optionsContent.innerHTML = html;
}

function closeStreamingModal() {
  document.getElementById('streaming-modal').style.display = 'none';
}

function searchMovies(event) {
  event.preventDefault();
  const input = document.getElementById('search-input');
  searchQuery = input.value.trim();
  currentPage = 1;
  renderMovies(1);
}

function clearSearch() {
  searchQuery = '';
  document.getElementById('search-input').value = '';
  currentPage = 1;
  renderMovies(1);
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  const trailerModal = document.getElementById('trailer-modal');
  const streamingModal = document.getElementById('streaming-modal');
  
  if (event.target === trailerModal) closeTrailerModal();
  if (event.target === streamingModal) closeStreamingModal();
});

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
  renderMovies(1);
});
