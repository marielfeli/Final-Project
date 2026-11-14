
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/properties';
const AUTH_URL = 'http://localhost:5000/api/auth';
const INQUIRY_URL = 'http://localhost:5000/api/inquiries';
const FAVORITES_URL = 'http://localhost:5000/api/favorites';

type Page =
  | 'home'
  | 'login'
  | 'register'
  | 'details'
  | 'favorites'
  | 'owner'
  | 'tenant';

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
  role: 'tenant' | 'owner' | 'admin';
};

type Inquiry = {
  _id: string;
  propertyId: string;
  propertyName: string;
  ownerName?: string;
  ownerEmail?: string;
  tenantName: string;
  tenantEmail: string;
  message: string;
  status: string;
  createdAt: string;
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
  const [editingProperty, setEditingProperty] =
    useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [tenantInquiries, setTenantInquiries] = useState<Inquiry[]>([]);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [additionalImageUrls, setAdditionalImageUrls] =
    useState<string[]>(['']);

  // GET PROPERTIES
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
      setError('Unable to connect to the server. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  // GET TENANT FAVORITES
const fetchFavorites = async (token: string) => {
  try {
    const response = await fetch(FAVORITES_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load favorites.');
    }

    const favoriteIds = data
      .filter((property: Property | null) => property !== null)
      .map((property: Property) => property._id);

    setFavorites(favoriteIds);
  } catch (err) {
    console.error('Error loading favorites:', err);
    setFavorites([]);
  }
};

  useEffect(() => {
    fetchProperties();
  }, []);

  // LOAD FAVORITES AFTER TENANT LOGIN
useEffect(() => {
  if (loggedInUser?.role === 'tenant' && authToken) {
    fetchFavorites(authToken);
  } else {
    setFavorites([]);
  }
}, [loggedInUser, authToken]);

  // SEARCH PROPERTIES
  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.location.toLowerCase().includes(search.toLowerCase())
  );

  // TOGGLE FAVORITES USING MONGODB
const toggleFavorite = async (id: string) => {
  if (!loggedInUser || !authToken) {
    alert('Please login as a tenant to save favorites.');
    setPage('login');
    return;
  }

  if (loggedInUser.role !== 'tenant') {
    alert('Only tenant accounts can save favorites.');
    return;
  }

  const isFavorite = favorites.includes(id);

  try {
    const response = await fetch(`${FAVORITES_URL}/${id}`, {
      method: isFavorite ? 'DELETE' : 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update favorites.');
    }

    const updatedFavorites = data.favorites
      .filter((property: Property | null) => property !== null)
      .map((property: Property) => property._id);

    setFavorites(updatedFavorites);

  } catch (err) {
    console.error('Favorite error:', err);

    alert(
      err instanceof Error
        ? err.message
        : 'Unable to update favorites.'
    );
  }
};

  // OPEN PROPERTY DETAILS
  const openDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowContactForm(false);
    setPage('details');
  };

  // REGISTER
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name'));
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));
    const role = String(formData.get('role'));

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
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      form.reset();
      alert('Registration successful! You can now login.');
      setPage('login');
    } catch (err) {
      console.error('Registration error:', err);
      alert(
        err instanceof Error ? err.message : 'Unable to register.'
      );
    }
  };

  // LOGIN
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
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
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setLoggedInUser(data.user);
      setAuthToken(data.token);
      setTenantInquiries([]);
      setInquiries([]);
      form.reset();

      alert(`Welcome to StayFinder, ${data.user.name}!`);
      setPage('home');
    } catch (err) {
      console.error('Login error:', err);
      alert(err instanceof Error ? err.message : 'Unable to login.');
    }
  };

  // LOGOUT
  const handleLogout = () => {
    setLoggedInUser(null);
    setAuthToken(null);
    setInquiries([]);
    setTenantInquiries([]);
    setFavorites([]);
    setPage('home');
    alert('You have logged out successfully.');
  };

  // GET TENANT INQUIRIES
  const fetchTenantInquiries = async () => {
    if (!authToken || loggedInUser?.role !== 'tenant') return;

    try {
      setInquiryLoading(true);

      const response = await fetch(
        `${INQUIRY_URL}/tenant-inquiries`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load your inquiries.');
      }

      setTenantInquiries(data);
    } catch (err) {
      console.error('Error loading tenant inquiries:', err);
      setTenantInquiries([]);
    } finally {
      setInquiryLoading(false);
    }
  };

  // GET OWNER INQUIRIES
  const fetchInquiries = async () => {
    if (!authToken || loggedInUser?.role !== 'owner') return;

    try {
      setInquiryLoading(true);

      const response = await fetch(
        `${INQUIRY_URL}/my-inquiries`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load inquiries.');
      }

      setInquiries(data);
    } catch (err) {
      console.error('Error loading inquiries:', err);
      setInquiries([]);
    } finally {
      setInquiryLoading(false);
    }
  };

  // LOAD INQUIRIES WHEN OPENING DASHBOARDS
  useEffect(() => {
    if (page === 'owner' && loggedInUser?.role === 'owner') {
      fetchInquiries();
    }

    if (page === 'tenant' && loggedInUser?.role === 'tenant') {
      fetchTenantInquiries();
    }
  }, [page, loggedInUser, authToken]);

  // SEND TENANT INQUIRY
  const handleSendInquiry = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!loggedInUser || !authToken) {
      alert('Please login as a tenant before sending an inquiry.');
      setPage('login');
      return;
    }

    if (loggedInUser.role !== 'tenant') {
      alert('Only tenant accounts can send inquiries.');
      return;
    }

    if (!selectedProperty) return;

    const formData = new FormData(e.currentTarget);
    const message = String(formData.get('message') || '').trim();

    if (!message) {
      alert('Please write your message.');
      return;
    }

    try {
      const response = await fetch(INQUIRY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          propertyId: selectedProperty._id,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send inquiry.');
      }

      alert('Your inquiry was sent successfully!');
      setShowContactForm(false);

      await fetchTenantInquiries();
    } catch (err) {
      console.error('Error sending inquiry:', err);
      alert(
        err instanceof Error ? err.message : 'Unable to send inquiry.'
      );
    }
  };

  // MARK INQUIRY AS READ
  const handleMarkAsRead = async (inquiryId: string) => {
    try {
      const response = await fetch(
        `${INQUIRY_URL}/${inquiryId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update inquiry.');
      }

      await fetchInquiries();
      alert('Inquiry marked as read!');
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    }
  };

  // ADD PROPERTY
  const handleAddProperty = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const image = String(formData.get('image'));

    const photos = [
      image,
      ...additionalImageUrls
        .map((url) => url.trim())
        .filter((url) => url !== ''),
    ];

    const newProperty = {
      name: String(formData.get('name')),
      location: String(formData.get('location')),
      price: Number(formData.get('price')),
      type: String(formData.get('type')),
      image,
      photos,
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
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(newProperty),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add property.');
      }

      await fetchProperties();
      form.reset();
      setAdditionalImageUrls(['']);
      setShowAddForm(false);

      alert('Property added successfully!');
    } catch (err) {
      console.error('Error adding property:', err);
      alert(err instanceof Error ? err.message : 'Unable to add property.');
    }
  };

  // UPDATE PROPERTY
  const handleUpdateProperty = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!editingProperty) return;

    const formData = new FormData(e.currentTarget);
    const image = String(formData.get('image'));

    const photos = [
      image,
      ...additionalImageUrls
        .map((url) => url.trim())
        .filter((url) => url !== ''),
    ];

    const updatedProperty = {
      name: String(formData.get('name')),
      location: String(formData.get('location')),
      price: Number(formData.get('price')),
      type: String(formData.get('type')),
      image,
      photos,
      description: String(formData.get('description')),
      amenities: String(formData.get('amenities'))
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''),
      ownerName: String(formData.get('ownerName')),
      ownerEmail: String(formData.get('ownerEmail')),
    };

    try {
      const response = await fetch(
        `${API_URL}/${editingProperty._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updatedProperty),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update property.');
      }

      await fetchProperties();

      setEditingProperty(null);
      setAdditionalImageUrls(['']);
      setShowAddForm(false);

      alert('Property updated successfully!');
    } catch (err) {
      console.error('Error updating property:', err);
      alert(err instanceof Error ? err.message : 'Unable to update property.');
    }
  };

  // DELETE PROPERTY
  const deleteProperty = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this property?'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete property.');
      }

      setFavorites((current) =>
        current.filter((favoriteId) => favoriteId !== id)
      );

      await fetchProperties();
      alert('Property deleted successfully!');
    } catch (err) {
      console.error('Error deleting property:', err);
      alert(err instanceof Error ? err.message : 'Unable to delete property.');
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

        <button className="back-btn" onClick={() => setPage('home')}>
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

          <label>Account Type</label>
          <select name="role" required defaultValue="tenant">
            <option value="tenant">Tenant</option>
            <option value="owner">Property Owner</option>
          </select>

          <button type="submit" className="auth-btn">
            Create Account
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <button onClick={() => setPage('login')}>Login</button>
        </p>

        <button className="back-btn" onClick={() => setPage('home')}>
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
          <button className="back-btn" onClick={() => setPage('home')}>
            ← Back to Home
          </button>
        </div>
      );
    }

    const isFavorite = favorites.includes(selectedProperty._id);

    const propertyPhotos = [
      ...new Set(
        selectedProperty.photos?.length
          ? selectedProperty.photos
          : [selectedProperty.image]
      ),
    ];

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
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(selectedProperty._id)}
          >
            {isFavorite ? '♥ Saved to Favorites' : '♡ Add to Favorites'}
          </button>
        </div>

        <div className="details-gallery">
          {propertyPhotos.map((photo, index) => (
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
              {selectedProperty.amenities?.map((amenity) => (
                <span key={amenity}>✓ {amenity}</span>
              ))}
            </div>
          </div>

          <div className="details-sidebar">
            <p>Monthly Rental Price</p>
            <h2>₱{selectedProperty.price.toLocaleString()}</h2>
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
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(selectedProperty._id)}
            >
              {isFavorite ? '♥ Remove Favorite' : '♡ Add to Favorites'}
            </button>

            {showContactForm && (
              <div className="contact-form">
                <h3>Contact Property Owner</h3>
                <p>Send an inquiry about {selectedProperty.name}.</p>

                <form onSubmit={handleSendInquiry}>
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={loggedInUser?.name || ''}
                    placeholder="Login as a tenant first"
                    readOnly
                    required
                  />

                  <label>Email Address</label>
                  <input
                    type="email"
                    value={loggedInUser?.email || ''}
                    placeholder="Login as a tenant first"
                    readOnly
                    required
                  />

                  <label>Your Message</label>
                  <textarea
                    name="message"
                    placeholder="Write your message..."
                    rows={4}
                    required
                  />

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={
                      !loggedInUser || loggedInUser.role !== 'tenant'
                    }
                  >
                    Send Message
                  </button>

                  {!loggedInUser && (
                    <p>Please login with a tenant account to send an inquiry.</p>
                  )}

                  {loggedInUser && loggedInUser.role !== 'tenant' && (
                    <p>Only tenant accounts can send inquiries.</p>
                  )}

                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setShowContactForm(false)}
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
    const favoriteProperties = properties.filter((property) =>
      favorites.includes(property._id)
    );

    return (
      <div className="properties favorites-page">
        <button className="back-btn" onClick={() => setPage('home')}>
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
              <div className="property-card" key={property._id}>
                <div className="property-image-wrapper">
                  <img src={property.image} alt={property.name} />
                  <button
                    className="card-favorite active"
                    onClick={() => toggleFavorite(property._id)}
                  >
                    ♥
                  </button>
                </div>

                <div className="property-info">
                  <span className="property-type">{property.type}</span>
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
            <button className="view-btn" onClick={() => setPage('home')}>
              Explore Properties
            </button>
          </div>
        )}
      </div>
    );
  };

  // TENANT DASHBOARD
  const TenantDashboardPage = () => (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <div>
          <p className="tagline">TENANT ACCOUNT</p>
          <h1>Tenant Dashboard</h1>
          <p>Welcome, {loggedInUser?.name}!</p>
          <p>Track the inquiries you sent to property owners.</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{tenantInquiries.length}</h3>
          <p>Total Inquiries</p>
        </div>

        <div className="stat-card">
          <h3>
            {tenantInquiries.filter(
              (inquiry) => inquiry.status === 'New'
            ).length}
          </h3>
          <p>Pending Inquiries</p>
        </div>

        <div className="stat-card">
          <h3>
            {tenantInquiries.filter(
              (inquiry) => inquiry.status === 'Read'
            ).length}
          </h3>
          <p>Read Inquiries</p>
        </div>
      </div>

      <div className="dashboard-listings">
        <h2>My Sent Inquiries</h2>

        {inquiryLoading ? (
          <p>Loading your inquiries...</p>
        ) : tenantInquiries.length > 0 ? (
          tenantInquiries.map((inquiry) => (
            <div className="dashboard-property" key={inquiry._id}>
              <div>
                <h3>{inquiry.propertyName}</h3>
                <p>Owner: {inquiry.ownerName || 'Property Owner'}</p>
                <p>Message: {inquiry.message}</p>
                <p>
                  Status:{' '}
                  <strong>{inquiry.status}</strong>
                </p>
                <small>
                  Sent: {new Date(inquiry.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-favorites">
            <h3>No Inquiries Yet</h3>
            <p>You haven't sent any inquiries to property owners.</p>
            <button
              className="view-btn"
              onClick={() => setPage('home')}
            >
              Explore Properties
            </button>
          </div>
        )}

        <button
          className="view-btn"
          onClick={fetchTenantInquiries}
        >
          Refresh My Inquiries
        </button>
      </div>

      <button className="back-btn" onClick={() => setPage('home')}>
        ← Back to Home
      </button>
    </div>
  );

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
          onClick={() => {
            if (showAddForm) {
              setShowAddForm(false);
              setEditingProperty(null);
              setAdditionalImageUrls(['']);
            } else {
              setEditingProperty(null);
              setAdditionalImageUrls(['']);
              setShowAddForm(true);
            }
          }}
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

      <div className="dashboard-listings">
        <h2>
          Tenant Inquiries (
          {inquiries.filter((inquiry) => inquiry.status !== 'Read').length}
          {' '}unread)
        </h2>

        {inquiryLoading ? (
          <p>Loading inquiries...</p>
        ) : inquiries.length > 0 ? (
          inquiries.map((inquiry) => (
            <div className="dashboard-property" key={inquiry._id}>
              <div>
                <h3>{inquiry.propertyName}</h3>
                <p>Tenant: {inquiry.tenantName}</p>
                <p>Email: {inquiry.tenantEmail}</p>
                <p>Message: {inquiry.message}</p>
                <p>
                  Status: <strong>{inquiry.status}</strong>
                </p>

                <small>
                  {new Date(inquiry.createdAt).toLocaleString()}
                </small>

                {inquiry.status !== 'Read' && (
                  <button
                    className="view-btn"
                    onClick={() => handleMarkAsRead(inquiry._id)}
                  >
                    Mark as Read
                  </button>
                )}

                {inquiry.status === 'Read' && (
                  <p>✓ This inquiry has been read.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No tenant inquiries yet.</p>
        )}

        <button className="view-btn" onClick={fetchInquiries}>
          Refresh Inquiries
        </button>
      </div>

      {showAddForm && (
        <div className="add-property-form">
          <h2>
            {editingProperty ? 'Edit Property' : 'Add New Property'}
          </h2>

          <form
            onSubmit={
              editingProperty
                ? handleUpdateProperty
                : handleAddProperty
            }
          >
            <label>Property Name</label>
            <input
              name="name"
              type="text"
              placeholder="Enter property name"
              defaultValue={editingProperty?.name || ''}
              required
            />

            <label>Location</label>
            <input
              name="location"
              type="text"
              placeholder="Enter city or location"
              defaultValue={editingProperty?.location || ''}
              required
            />

            <label>Monthly Rental Price (₱)</label>
            <input
              name="price"
              type="number"
              min="1"
              placeholder="Enter monthly price"
              defaultValue={editingProperty?.price || ''}
              required
            />

            <label>Property Type</label>
            <select
              name="type"
              required
              defaultValue={editingProperty?.type || ''}
            >
              <option value="">Select property type</option>
              <option value="Apartment">Apartment</option>
              <option value="Studio">Studio</option>
              <option value="Room">Room</option>
              <option value="House">House</option>
            </select>

            <label>Main Property Image URL</label>
            <input
              name="image"
              type="url"
              placeholder="Paste main image URL"
              defaultValue={editingProperty?.image || ''}
              required
            />

            <label>Additional Property Image URLs</label>

            {additionalImageUrls.map((url, index) => (
              <div className="additional-image-input" key={index}>
                <input
                  type="url"
                  placeholder={`Paste additional image URL ${index + 1}`}
                  value={url}
                  onChange={(e) => {
                    const updatedUrls = [...additionalImageUrls];
                    updatedUrls[index] = e.target.value;
                    setAdditionalImageUrls(updatedUrls);
                  }}
                />

                <button
                  type="button"
                  className="delete-property-btn"
                  onClick={() => {
                    setAdditionalImageUrls((current) =>
                      current.filter((_, i) => i !== index)
                    );
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className="view-btn"
              onClick={() =>
                setAdditionalImageUrls((current) => [...current, ''])
              }
            >
              + Add Another URL
            </button>

            <label>Property Description</label>
            <textarea
              name="description"
              rows={4}
              placeholder="Describe your property"
              defaultValue={editingProperty?.description || ''}
              required
            />

            <label>Amenities (separate with commas)</label>
            <input
              name="amenities"
              type="text"
              placeholder="Wi-Fi, Kitchen, Parking"
              defaultValue={editingProperty?.amenities.join(', ') || ''}
              required
            />

            <label>Owner Name</label>
            <input
              name="ownerName"
              type="text"
              placeholder="Enter owner name"
              defaultValue={editingProperty?.ownerName || ''}
              required
            />

            <label>Owner Email</label>
            <input
              name="ownerEmail"
              type="email"
              placeholder="Enter owner email"
              defaultValue={editingProperty?.ownerEmail || ''}
              required
            />

            <button type="submit" className="auth-btn">
              {editingProperty ? 'Save Changes' : 'Save Property'}
            </button>

            {editingProperty && (
              <button
                type="button"
                className="back-btn"
                onClick={() => {
                  setEditingProperty(null);
                  setAdditionalImageUrls(['']);
                  setShowAddForm(false);
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      )}

      <div className="dashboard-listings">
        <h2>My Property Listings</h2>

        {properties.length > 0 ? (
          properties.map((property) => (
            <div className="dashboard-property" key={property._id}>
              <img src={property.image} alt={property.name} />

              <div>
                <h3>{property.name}</h3>
                <p>📍 {property.location}</p>
                <p>₱{property.price.toLocaleString()} / month</p>
              </div>

              <button
                className="view-btn"
                onClick={() => openDetails(property)}
              >
                View Details
              </button>

              <button
                className="view-btn"
                onClick={() => {
                  setEditingProperty(property);

                  const extraPhotos = (property.photos || []).filter(
                    (photo) => photo !== property.image
                  );

                  setAdditionalImageUrls(
                    extraPhotos.length > 0 ? extraPhotos : ['']
                  );

                  setShowAddForm(true);
                }}
              >
                Edit
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
          <p>No properties listed yet. Click Add Property to create one.</p>
        )}
      </div>

      <button className="back-btn" onClick={() => setPage('home')}>
        ← Back to Home
      </button>
    </div>
  );

  // PAGE NAVIGATION
  if (page === 'login') return <LoginPage />;
  if (page === 'register') return <RegisterPage />;
  if (page === 'details') return <PropertyDetailsPage />;
  if (page === 'favorites') return <FavoritesPage />;

  if (page === 'owner') {
    if (loggedInUser?.role !== 'owner') {
      return (
        <div className="app">
          <p>Access denied. Owner account required.</p>
          <button className="back-btn" onClick={() => setPage('home')}>
            Back to Home
          </button>
        </div>
      );
    }

    return <OwnerDashboardPage />;
  }

  if (page === 'tenant') {
    if (loggedInUser?.role !== 'tenant') {
      return (
        <div className="app">
          <p>Access denied. Tenant account required.</p>
          <button className="back-btn" onClick={() => setPage('home')}>
            Back to Home
          </button>
        </div>
      );
    }

    return <TenantDashboardPage />;
  }

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

          {loggedInUser?.role === 'owner' && (
            <button
              className="favorites-nav-btn"
              onClick={() => {
                setShowAddForm(false);
                setPage('owner');
              }}
            >
              Owner Dashboard
            </button>
          )}

          {loggedInUser?.role === 'tenant' && (
            <button
              className="favorites-nav-btn"
              onClick={() => setPage('tenant')}
            >
              Tenant Dashboard
            </button>
          )}
        </nav>

        {loggedInUser ? (
          <div>
            <span>Welcome, {loggedInUser.name}!</span>
            <button className="login-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => setPage('login')}>
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
            <button className="view-btn" onClick={fetchProperties}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="property-grid">
              {filteredProperties.map((property) => (
                <div className="property-card" key={property._id}>
                  <div className="property-image-wrapper">
                    <img src={property.image} alt={property.name} />

                    <button
                      className={`card-favorite ${
                        favorites.includes(property._id) ? 'active' : ''
                      }`}
                      onClick={() => toggleFavorite(property._id)}
                      aria-label="Toggle favorite"
                    >
                      {favorites.includes(property._id) ? '♥' : '♡'}
                    </button>
                  </div>

                  <div className="property-info">
                    <span className="property-type">{property.type}</span>
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
