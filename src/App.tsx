
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/properties';
const AUTH_URL = 'http://localhost:5000/api/auth';

type Page =
  | 'home'
  | 'login'
  | 'register'
  | 'details'
  | 'favorites'
  | 'owner';

type Property = {
  _id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  image: string;
  photos: string[];
  description: string;
  amenities: string[];
  ownerName: string;
  ownerEmail: string;
};

type User = {
  id: string;
  name: string;
  email: string;
};

function App() {
  const [page, setPage] = useState<Page>('home');
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  // GET PROPERTIES FROM MONGODB
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Failed to load properties.');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError(
        'Unable to connect to the server. Please check your backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // SEARCH PROPERTIES
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase())
  );

  // TOGGLE FAVORITES
  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id]
    );
  };

  // OPEN PROPERTY DETAILS
  const openDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowContactForm(false);
    setPage('details');
  };

  // REGISTER FUNCTION
  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name'));
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const confirmPassword = String(
      formData.get('confirmPassword')
    );

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Registration failed.'
        );
      }

      form.reset();

      alert('Registration successful! You can now login.');
      setPage('login');
    } catch (err) {
      console.error('Registration error:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to register. Please try again.'
      );
    }
  };

  // LOGIN FUNCTION
  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get('email'));
    const password = String(formData.get('password'));

    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setLoggedInUser(data.user);

      form.reset();

      alert(`Welcome to StayFinder, ${data.user.name}!`);
      setPage('home');
    } catch (err) {
      console.error('Login error:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to login. Please try again.'
      );
    }
  };

  // LOGOUT FUNCTION
  const handleLogout = () => {
    setLoggedInUser(null);
    setPage('home');
    alert('You have logged out successfully.');
  };

  // ADD PROPERTY TO MONGODB
  const handleAddProperty = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const image = String(formData.get('image'));

    const newProperty = {
      name: String(formData.get('name')),
      location: String(formData.get('location')),
      price: Number(formData.get('price')),
      type: String(formData.get('type')),
      image,
      photos: [image, image, image],
      description: String(formData.get('description')),
      amenities: String(formData.get('amenities'))
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''),
      ownerName: String(formData.get('ownerName')),
      ownerEmail: String(formData.get('ownerEmail')),
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProperty),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to add property.'
        );
      }

      await fetchProperties();

      form.reset();
      setShowAddForm(false);

      alert('Property added successfully!');
    } catch (err) {
      console.error('Error adding property:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to add property. Please try again.'
      );
    }
  };

  // DELETE PROPERTY FROM MONGODB
  const deleteProperty = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this property?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete property.'
        );
      }

      setFavorites((current) =>
        current.filter((favoriteId) => favoriteId !== id)
      );

      await fetchProperties();

      alert('Property deleted successfully!');
    } catch (err) {
      console.error('Error deleting property:', err);

      alert(
        err instanceof Error
          ? err.message
          : 'Unable to delete property.'
      );
    }
  };

  // LOGIN PAGE
  const LoginPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back!</h2>
        <p>Login to your StayFinder account.</p>

        <form onSubmit={handleLogin}>
          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            required
          />

          <button type="submit" className="auth-btn">
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?
          <button onClick={() => setPage('register')}>
            Register
          </button>
        </p>

        <button
          className="back-btn"
          onClick={() => setPage('home')}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );

  // REGISTER PAGE
  const RegisterPage = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p>Join StayFinder and find your next home.</p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>
          <input
            name="name"
            type="text"
            placeholder="Enter your full name"
            required
          />

          <label>Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            minLength={6}
            required
          />

          <label>Confirm Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            minLength={6}
            required
          />

          <button type="submit" className="auth-btn">
            Create Account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <button onClick={() => setPage('login')}>
            Login
          </button>
        </p>

        <button
          className="back-btn"
          onClick={() => setPage('home')}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );

  // PROPERTY DETAILS PAGE
  const PropertyDetailsPage = () => {
    if (!selectedProperty) {
      return (
        <div className="details-container">
          <h2>Property not found.</h2>

          <button
            className="back-btn"
            onClick={() => setPage('home')}
          >
            ← Back to Home
          </button>
        </div>
      );
    }

    const isFavorite = favorites.includes(
      selectedProperty._id
    );

    return (
      <div className="details-container">
        <button
          className="back-btn"
          onClick={() => {
            setShowContactForm(false);
            setPage('home');
          }}
        >
          ← Back to Properties
        </button>

        <div className="details-heading">
          <div>
            <span className="property-type">
              {selectedProperty.type}
            </span>

            <h1>{selectedProperty.name}</h1>
            <p>📍 {selectedProperty.location}</p>
          </div>

          <button
            className={`favorite-btn ${
              isFavorite ? 'active' : ''
            }`}
            onClick={() =>
              toggleFavorite(selectedProperty._id)
            }
          >
            {isFavorite
              ? '♥ Saved to Favorites'
              : '♡ Add to Favorites'}
          </button>
        </div>

        <div className="details-gallery">
          {(selectedProperty.photos?.length
            ? selectedProperty.photos
            : [selectedProperty.image]
          ).map((photo, index) => (
            <img
              src={photo}
              alt={`${selectedProperty.name} photo ${index + 1}`}
              key={index}
            />
          ))}
        </div>

        <div className="details-content">
          <div className="details-main">
            <h2>About This Property</h2>
            <p>{selectedProperty.description}</p>

            <h2>Amenities</h2>

            <div className="amenities-list">
              {selectedProperty.amenities?.map(
                (amenity) => (
                  <span key={amenity}>✓ {amenity}</span>
                )
              )}
            </div>
          </div>

          <div className="details-sidebar">
            <p>Monthly Rental Price</p>

            <h2>
              ₱{selectedProperty.price.toLocaleString()}
            </h2>

            <span>/ month</span>

            <div className="owner-info">
              <h3>Property Owner</h3>
              <p>{selectedProperty.ownerName}</p>
              <p>{selectedProperty.ownerEmail}</p>
            </div>

            <button
              type="button"
              className="contact-owner-btn"
              onClick={() => setShowContactForm(true)}
            >
              Contact Owner
            </button>

            <button
              className={`favorite-btn ${
                isFavorite ? 'active' : ''
              }`}
              onClick={() =>
                toggleFavorite(selectedProperty._id)
              }
            >
              {isFavorite
                ? '♥ Remove Favorite'
                : '♡ Add to Favorites'}
            </button>

            {showContactForm && (
              <div className="contact-form">
                <h3>Contact Property Owner</h3>

                <p>
                  Send an inquiry about{' '}
                  {selectedProperty.name}.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();

                    alert(
                      'Message sending will be connected to the backend later.'
                    );

                    setShowContactForm(false);
                  }}
                >
                  <label>Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    required
                  />

                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    required
                  />

                  <label>Your Message</label>
                  <textarea
                    placeholder="Write your message..."
                    rows={4}
                    required
                  />

                  <button
                    type="submit"
                    className="auth-btn"
                  >
                    Send Message
                  </button>

                  <button
                    type="button"
                    className="back-btn"
                    onClick={() =>
                      setShowContactForm(false)
                    }
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // FAVORITES PAGE
  const FavoritesPage = () => {
    const favoriteProperties = properties.filter(
      (property) =>
        favorites.includes(property._id)
    );

    return (
      <div className="properties favorites-page">
        <button
          className="back-btn"
          onClick={() => setPage('home')}
        >
          ← Back to Home
        </button>

        <div className="section-heading">
          <div>
            <p className="tagline">YOUR SAVED PLACES</p>
            <h2>My Favorites ❤️</h2>
          </div>

          <p>Your favorite rooms and apartments.</p>
        </div>

        {favoriteProperties.length > 0 ? (
          <div className="property-grid">
            {favoriteProperties.map((property) => (
              <div
                className="property-card"
                key={property._id}
              >
                <div className="property-image-wrapper">
                  <img
                    src={property.image}
                    alt={property.name}
                  />

                  <button
                    className="card-favorite active"
                    onClick={() =>
                      toggleFavorite(property._id)
                    }
                    aria-label="Remove from favorites"
                  >
                    ♥
                  </button>
                </div>

                <div className="property-info">
                  <span className="property-type">
                    {property.type}
                  </span>

                  <h3>{property.name}</h3>
                  <p>📍 {property.location}</p>

                  <h3 className="price">
                    ₱{property.price.toLocaleString()}
                    <small> / month</small>
                  </h3>

                  <button
                    className="view-btn"
                    onClick={() => openDetails(property)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-favorites">
            <h3>No Favorites Yet</h3>
            <p>You haven't saved any properties.</p>

            <button
              className="view-btn"
              onClick={() => setPage('home')}
            >
              Explore Properties
            </button>
          </div>
        )}
      </div>
    );
  };

  // OWNER DASHBOARD
  const OwnerDashboardPage = () => (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="tagline">PROPERTY MANAGEMENT</p>
          <h1>Owner Dashboard</h1>
          <p>Manage your rooms and apartment listings.</p>
        </div>

        <button
          className="add-property-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Property'}
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{properties.length}</h3>
          <p>Total Properties</p>
        </div>

        <div className="stat-card">
          <h3>{favorites.length}</h3>
          <p>Saved Favorites</p>
        </div>
      </div>

      {showAddForm && (
        <div className="add-property-form">
          <h2>Add New Property</h2>

          <form onSubmit={handleAddProperty}>
            <label>Property Name</label>
            <input
              name="name"
              type="text"
              placeholder="Enter property name"
              required
            />

            <label>Location</label>
            <input
              name="location"
              type="text"
              placeholder="Enter city or location"
              required
            />

            <label>Monthly Rental Price (₱)</label>
            <input
              name="price"
              type="number"
              min="1"
              placeholder="Enter monthly price"
              required
            />

            <label>Property Type</label>
            <select name="type" required>
              <option value="">Select property type</option>
              <option value="Apartment">Apartment</option>
              <option value="Studio">Studio</option>
              <option value="Room">Room</option>
              <option value="House">House</option>
            </select>

            <label>Property Image URL</label>
            <input
              name="image"
              type="url"
              placeholder="Paste an image URL"
              required
            />

            <label>Property Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe your property"
              required
            />

            <label>Amenities (separate with commas)</label>
            <input
              name="amenities"
              type="text"
              placeholder="Wi-Fi, Kitchen, Parking"
              required
            />

            <label>Owner Name</label>
            <input
              name="ownerName"
              type="text"
              placeholder="Enter owner name"
              required
            />

            <label>Owner Email</label>
            <input
              name="ownerEmail"
              type="email"
              placeholder="Enter owner email"
              required
            />

            <button
              type="submit"
              className="auth-btn"
            >
              Save Property
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-listings">
        <h2>My Property Listings</h2>

        {properties.length > 0 ? (
          properties.map((property) => (
            <div
              className="dashboard-property"
              key={property._id}
            >
              <img
                src={property.image}
                alt={property.name}
              />

              <div>
                <h3>{property.name}</h3>
                <p>📍 {property.location}</p>
                <p>
                  ₱{property.price.toLocaleString()} / month
                </p>
              </div>

              <button
                className="view-btn"
                onClick={() => openDetails(property)}
              >
                View Details
              </button>

              <button
                className="delete-property-btn"
                onClick={() => deleteProperty(property._id)}
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>
            No properties listed yet. Click Add Property to create one.
          </p>
        )}
      </div>

      <button
        className="back-btn"
        onClick={() => setPage('home')}
      >
        ← Back to Home
      </button>
    </div>
  );

  // SELECT PAGE
  if (page === 'login') return <LoginPage />;
  if (page === 'register') return <RegisterPage />;
  if (page === 'details') return <PropertyDetailsPage />;
  if (page === 'favorites') return <FavoritesPage />;
  if (page === 'owner') return <OwnerDashboardPage />;

  // HOME PAGE
  return (
    <div className="app">
      <header className="navbar">
        <h2 className="logo">
          Stay<span>Finder.</span>
        </h2>

        <nav>
          <a href="#home">Home</a>
          <a href="#properties">Properties</a>
          <a href="#about">About</a>

          <button
            className="favorites-nav-btn"
            onClick={() => setPage('favorites')}
          >
            ♥ Favorites ({favorites.length})
          </button>

          <button
            className="favorites-nav-btn"
            onClick={() => {
              setShowAddForm(false);
              setPage('owner');
            }}
          >
            Owner Dashboard
          </button>
        </nav>

        {loggedInUser ? (
          <div>
            <span>Welcome, {loggedInUser.name}!</span>
            <button
              className="login-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            className="login-btn"
            onClick={() => setPage('login')}
          >
            Login
          </button>
        )}
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="tagline">FIND YOUR PERFECT PLACE</p>

          <h1>
            Find a Place
            <br />
            You'll Love to Call Home.
          </h1>

          <p>
            Discover comfortable rooms and apartments
            that fit your lifestyle and budget.
          </p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by property or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button>Search</button>
          </div>
        </div>
      </section>

      <section className="properties" id="properties">
        <div className="section-heading">
          <div>
            <p className="tagline">EXPLORE PLACES</p>
            <h2>Featured Properties</h2>
          </div>

          <p>Find your next home with StayFinder.</p>
        </div>

        {loading ? (
          <p>Loading properties...</p>
        ) : error ? (
          <div>
            <p className="no-results">{error}</p>

            <button
              className="view-btn"
              onClick={fetchProperties}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="property-grid">
              {filteredProperties.map((property) => (
                <div
                  className="property-card"
                  key={property._id}
                >
                  <div className="property-image-wrapper">
                    <img
                      src={property.image}
                      alt={property.name}
                    />

                    <button
                      className={`card-favorite ${
                        favorites.includes(property._id)
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        toggleFavorite(property._id)
                      }
                      aria-label="Toggle favorite"
                    >
                      {favorites.includes(property._id)
                        ? '♥'
                        : '♡'}
                    </button>
                  </div>

                  <div className="property-info">
                    <span className="property-type">
                      {property.type}
                    </span>

                    <h3>{property.name}</h3>
                    <p>📍 {property.location}</p>

                    <h3 className="price">
                      ₱{property.price.toLocaleString()}
                      <small> / month</small>
                    </h3>

                    <button
                      className="view-btn"
                      onClick={() => openDetails(property)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <p className="no-results">
                {properties.length === 0
                  ? 'No properties available yet. Add a property through the Owner Dashboard.'
                  : 'No properties found.'}
              </p>
            )}
          </>
        )}
      </section>

      <footer id="about">
        <h2>StayFinder.</h2>
        <p>Find Your Space. Feel at Home.</p>
        <p>© 2026 StayFinder. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
