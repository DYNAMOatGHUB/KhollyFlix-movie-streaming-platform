// Replace 'YOUR_API_KEY' with your actual TMDB API key
const TMDB_API_KEY = 'b9cd4ee40ca04611f564a0127bfbea03';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const moviesContainer = document.getElementById("movies");

async function fetchTrendingMovies() {
  const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
  if (!response.ok) throw new Error('Failed to fetch movies');
  return response.json();
}

async function fetchMovieDetails(movieId) {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
  if (!response.ok) throw new Error('Failed to fetch movie details');
  return response.json();
}

function formatRuntime(minutes) {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function renderMovieCard(movie) {
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  return `
    <article class="movie-card" data-movie-id="${movie.id}">
      <div class="poster-container">
        <img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster">
        <div class="movie-overlay">
          <button class="watch-btn" onclick="watchMovie(${movie.id})">
            <span>▶</span> Watch Now
          </button>
        </div>
      </div>
      <div class="movie-info">
        <h2 class="movie-title">${movie.title}</h2>
        <p class="movie-meta">${movie.release_date?.split('-')[0] || '2026'} • ${movie.vote_average?.toFixed(1) || 'N/A'}⭐</p>
        <p class="movie-description">${movie.overview || 'No description available.'}</p>
      </div>
    </article>
  `;
}

async function renderMovies() {
  try {
    moviesContainer.innerHTML = '<div class="loading">Loading movies...</div>';
    
    if (TMDB_API_KEY === 'YOUR_API_KEY') {
      // Fallback to local data when no API key is provided
      const response = await fetch('movies-2026.json');
      const localMovies = await response.json();
      moviesContainer.innerHTML = localMovies.map(movie => `
        <article class="movie-card">
          <div class="poster-container">
            <img src="${movie.poster}" alt="${movie.title} poster" class="movie-poster">
            <div class="movie-overlay">
              <button class="watch-btn">
                <span>▶</span> Watch Now
              </button>
            </div>
          </div>
          <div class="movie-info">
            <h2 class="movie-title">${movie.title}</h2>
            <p class="movie-meta">${movie.genre} • ${movie.runtime}</p>
            <p class="movie-description">${movie.description}</p>
          </div>
        </article>
      `).join('');
      return;
    }
    
    const data = await fetchTrendingMovies();
    const movies = data.results.slice(0, 12); // Limit to 12 movies
    
    moviesContainer.innerHTML = movies.map(renderMovieCard).join('');
  } catch (error) {
    moviesContainer.innerHTML = `
      <div class="error-state">
        <h3>Unable to load movies</h3>
        <p>Please check your connection or try again later.</p>
        <button onclick="renderMovies()">Retry</button>
      </div>
    `;
    console.error('Failed to render movies', error);
  }
}

function watchMovie(movieId) {
  // Placeholder for watch functionality
  alert(`Feature coming soon! Movie ID: ${movieId}`);
  // In a real app, this would navigate to a player page or streaming service
}

// Initialize the app
renderMovies();
