'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Typography, Button, CircularProgress, Alert, Box, AppBar, Toolbar, Avatar, 
  Menu, MenuItem, Divider, TextField, InputAdornment, Chip, Stack, Autocomplete,
  FormControl, InputLabel, Select, Fade
} from '@mui/material';
import { 
  Login as LoginIcon, Person, Logout, AdminPanelSettings, Refresh, Search as SearchIcon,
  Clear as ClearIcon, FilterList, TrendingUp
} from '@mui/icons-material';
import { Event } from '@/types';
import { fetchEnoughEvents } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { AuthDialog } from '@/components/AuthDialog';
import { useUser } from '@/context/UserContext';
import { searchEvents, getAvailableGenres } from '@/lib/search-client';

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// make date and times more readable - done
// fix id's on admin page to the id's in the database - done
// fix create/ delete/ update event
//have a page for each event - done 
//ticketing options
// Events that happend yesterday should not be there - done 
//sort/ search bar through mongo ( account for user mistakes in spellings)
//profile page - done
// be able to save events - done 
// make saved events more obvious on event card and event page
// be able to unsave events 
// take into account sold out events filetr out sold out text and put it in corner in red icon - done
//stripe
// instead of pagination when user gets to the bottom of the page, more events load in - done
// fix mobile view

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  
  const User = useUser();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Popular search terms
  const popularSearches = ['Concert', 'Comedy', 'Food Festival', 'Theater', 'Sports', 'Art'];

  // Load available genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genres = await getAvailableGenres();
        setAvailableGenres(genres);
      } catch (error) {
        console.error('Failed to load genres:', error);
      }
    };
    loadGenres();
  }, []);

  // Search function using API routes
  const performSearch = async (query: string, genre: string = '', skip: number = 0) => {
    if (!query.trim() && !genre.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchTotal(0);
      return;
    }

    if (skip === 0) {
      setSearchLoading(true);
    } else {
      setLoadingMore(true);
    }
    setSearchError(null);
    
    try {
      const result = await searchEvents({
        query: query.trim(),
        genre: genre.trim(),
        limit: 20,
        skip
      });
      
      if (skip === 0) {
        setSearchResults(result.events);
      } else {
        setSearchResults(prev => [...prev, ...result.events]);
      }
      
      setSearchHasMore(result.hasMore);
      setSearchTotal(result.total);
      setIsSearching(true);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
      if (skip === 0) {
        setSearchResults([]);
        setSearchHasMore(false);
        setSearchTotal(0);
      }
    } finally {
      setSearchLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, selectedGenre, 0);
    }, 300);
  };

  // Handle genre selection
  const handleGenreChange = (genre: string) => {
    setSelectedGenre(genre);
    performSearch(searchQuery, genre, 0);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setIsSearching(false);
    setSearchResults([]);
    setSearchError(null);
    setSearchHasMore(false);
    setSearchTotal(0);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Handle popular search click
  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    performSearch(term, selectedGenre, 0);
  };

  // Load more search results
  const loadMoreSearchResults = () => {
    if (!searchHasMore || loadingMore) return;
    performSearch(searchQuery, selectedGenre, searchResults.length);
  };

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Filter out past events
  const filterUpcomingEvents = (eventsList: Event[]): Event[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    return eventsList.filter((event) => {
      if (event.startDate === 'TBA' || !event.startDate) {
        return true; 
      }
      try {
        const eventDate = new Date(event.startDate);
        return eventDate >= today;
      } catch (error) {
        console.warn(`Invalid date format for event ${event.id}: ${event.startDate}`);
        return true; 
      }
    });
  };

  // Load regular events (non-search)
  const loadEvents = async (page: number, refresh: boolean = false, append: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else if (append) {
      setLoadingMore(true);
    } else {
      setEventsLoading(true);
    }
    setError(null);
    
    try {
      const refreshParam = refresh ? '&refresh=true' : '';
      const response = await fetch(`/api/events?targetCount=20&maxPages=5&page=${page}${refreshParam}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Loaded events:', data.events?.length || 0);
      
      if (data.events && data.events.length > 0) {
        const validEvents = data.events
          .filter((event: Event) => event.title && event.startDate && event.location);

        const upcomingEvents = filterUpcomingEvents(validEvents);
        const sortedEvents = upcomingEvents.sort((a: Event, b: Event) => {
          if (a.startDate === 'TBA' && b.startDate === 'TBA') return 0;
          if (a.startDate === 'TBA') return 1;
          if (b.startDate === 'TBA') return -1;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
        
        if (append) {
          setEvents(prevEvents => {
            const existingIds = new Set(prevEvents.map(e => e.id));
            const newEvents = sortedEvents.filter(e => !existingIds.has(e.id));
            return [...prevEvents, ...newEvents];
          });
          
          if (sortedEvents.length < 20) {
            setHasMoreEvents(false);
          }
        } else {
          setEvents(sortedEvents.slice(0, 20));
          setHasMoreEvents(sortedEvents.length === 20);
        }
        
        if (refresh) {
          setLastRefresh(new Date());
        }
      } else {
        if (!append) {
          setEvents([]);
        }
        setHasMoreEvents(false);
      }
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Error loading events:', err);
      if (!append) {
        setEvents([]);
      }
    } finally {
      setEventsLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (loadingMore) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.offsetHeight - 1000;
    
    if (scrollPosition >= threshold) {
      if (isSearching && searchHasMore) {
        // Load more search results
        loadMoreSearchResults();
      } else if (!isSearching && hasMoreEvents) {
        // Load more regular events
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        loadEvents(nextPage, false, true);
      }
    }
  }, [loadingMore, hasMoreEvents, searchHasMore, currentPage, isSearching, searchResults.length]);

  // Initial load and auto-refresh
  useEffect(() => {
    loadEvents(0);
    
    const refreshInterval = setInterval(() => {
      if (!isSearching) {
        loadEvents(0, true);
        setCurrentPage(0);
        setHasMoreEvents(true);
      }
    }, 100 * 60 * 1000); 
    
    return () => clearInterval(refreshInterval);
  }, [isSearching]);

  // Scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleRefreshEvents = () => {
    if (isSearching) {
      // Refresh search results
      performSearch(searchQuery, selectedGenre, 0);
    } else {
      // Refresh regular events
      setCurrentPage(0);
      setHasMoreEvents(true);
      loadEvents(0, true);
    }
  };

  const handleLoginClick = () => {
    setAuthDialogOpen(true);
  };

  const handleLogin = async (credentials: { username: string; password: string }) => {
    setLoginError(null);
    try {
      const result = await User.login(credentials);
      
      if (result.success) {
        setAuthDialogOpen(false);
        console.log('Login successful');
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred');
    }
  };

  const handleRegister = async (userData: any) => {
    setLoginError(null);
    try {
      const result = await User.register(userData);
      
      if (!result.success) {
        setLoginError(result.error || 'Registration failed');
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error; 
    }
  };

  const handleAuthDialogClose = () => {
    setAuthDialogOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    window.location.href = '/profile';
  };

  const handleAdminPanel = () => {
    handleProfileMenuClose();
    window.location.href = '/admin';
  };

  const getUserDisplayName = () => {
    if (User.user?.firstName && User.user?.lastName) {
      return `${User.user.firstName} ${User.user.lastName}`;
    }
    return User.user?.username || 'User';
  };

  const getUserInitial = () => {
    if (User.user?.firstName) {
      return User.user.firstName.charAt(0).toUpperCase();
    }
    return User.user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return '';
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastRefresh.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  // Show loading only when BOTH authentication and events are loading initially
  const showInitialLoading = User.loading && eventsLoading;

  // Determine which events to display
  const displayEvents = isSearching ? searchResults : events;
  const displayLoading = isSearching ? searchLoading : eventsLoading;
  const displayHasMore = isSearching ? searchHasMore : hasMoreEvents;

  if (showInitialLoading) {
    return (
      <Box className="loading-container">
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="primary" size={40} />
          <Typography className="loading-text" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Login/Profile */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Chivent
          </Typography>
          
          {User.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                Welcome, {getUserDisplayName()}
              </Typography>
              <Button
                onClick={handleProfileMenuOpen}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'secondary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {getUserInitial()}
                </Avatar>
              </Button>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">
                      {getUserDisplayName()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {User.user.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileClick}>
                  <Person sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                {User.user.role === 'admin' && (
                  <MenuItem onClick={handleAdminPanel}>
                    <AdminPanelSettings sx={{ mr: 1 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={User.logout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LoginIcon />}
              onClick={handleLoginClick}
              sx={{ textTransform: 'none' }}
              disabled={User.loading}
            >
              {User.loading ? 'Loading...' : 'Login / Register'}
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" color="primary" gutterBottom>
            {isSearching ? 'Search Results' : 'Upcoming Events in Chicago'}
          </Typography>
          
          {/* Search Section */}
          <Box sx={{ mb: 3 }}>
            <Stack spacing={2}>
              {/* Search Bar and Genre Filter */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'flex-start' }
              }}>
                <TextField
                  fullWidth
                  placeholder="Search events, venues, or keywords..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={clearSearch}
                          sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                          <ClearIcon fontSize="small" />
                        </Button>
                      </InputAdornment>
                    )
                  }}
                  sx={{ flexGrow: 1 }}
                />
                
                <Autocomplete
                  options={availableGenres}
                  value={selectedGenre}
                  onChange={(_, value) => handleGenreChange(value || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select genre..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <FilterList color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  sx={{ minWidth: { xs: '100%', md: 200 } }}
                  clearOnEscape
                />
              </Box>

              {/* Popular Searches */}
              {!isSearching && (
                <Fade in={!isSearching}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrendingUp fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Popular searches:
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {popularSearches.map((term) => (
                        <Chip
                          key={term}
                          label={term}
                          onClick={() => handlePopularSearchClick(term)}
                          variant="outlined"
                          size="small"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Fade>
              )}

              {/* Search Status */}
              {isSearching && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchLoading ? 'Searching...' : `Found ${searchTotal} events`}
                    {searchQuery && ` for "${searchQuery}"`}
                    {selectedGenre && ` in "${selectedGenre}"`}
                    {searchResults.length < searchTotal && ` (showing ${searchResults.length})`}
                  </Typography>
                  <Button
                    size="small"
                    onClick={clearSearch}
                    startIcon={<ClearIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Clear Search
                  </Button>
                </Box>
              )}

              {/* Search Error */}
              {searchError && (
                <Alert severity="error" onClose={() => setSearchError(null)}>
                  {searchError}
                </Alert>
              )}
            </Stack>
          </Box>
        </Box>
        
        {lastRefresh && !isSearching && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last updated: {formatLastRefresh()}
          </Typography>
        )}
        
        {displayLoading && displayEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress color="primary" size={40} />
            <Typography sx={{ mt: 2 }}>
              {isSearching ? 'Searching events...' : 'Loading events...'}
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto', mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => loadEvents(0)}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : (!displayEvents || displayEvents.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {isSearching ? 'No events found matching your search.' : 'No upcoming events found.'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isSearching 
                ? 'Try adjusting your search terms or clearing filters.' 
                : 'Try refreshing or check back later for new events.'
              }
            </Typography>
            {isSearching ? (
              <Button
                variant="contained"
                onClick={clearSearch}
                startIcon={<ClearIcon />}
              >
                Clear Search
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleRefreshEvents}
                startIcon={<Refresh />}
              >
                Refresh Events
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box className="events-grid" sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 3,
              mb: 4
            }}>
              {displayEvents.map((event) => (
                <EventCard key={`${event.id}-${event.source}`} event={event} />
              ))}
            </Box>
            
            {/* Loading more indicator */}
            {loadingMore && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress color="primary" size={30} />
                <Typography sx={{ mt: 2 }}>
                  Loading more events...
                </Typography>
              </Box>
            )}
            
            {/* End of events indicator */}
            {!displayHasMore && displayEvents.length > 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {isSearching ? 
                    `You've seen all ${searchTotal} search results` : 
                    'You\'ve reached the end of available events'
                  }
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleRefreshEvents}
                  startIcon={<Refresh />}
                  sx={{ mt: 2 }}
                >
                  {isSearching ? 'Refresh Search' : 'Refresh for New Events'}
                </Button>
                {isSearching && (
                  <Button
                    variant="outlined"
                    onClick={clearSearch}
                    startIcon={<ClearIcon />}
                    sx={{ mt: 2, ml: 2 }}
                  >
                    Browse All Events
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Authentication Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onClose={handleAuthDialogClose}
        onSubmit={handleLogin}
        onRegister={handleRegister}
        error={loginError}
      />
    </Box>
  );
}