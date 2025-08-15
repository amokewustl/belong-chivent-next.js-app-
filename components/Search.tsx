import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, InputAdornment, Paper, List, ListItem, ListItemText, Typography, Chip, Stack, IconButton, Fade, Divider} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, TrendingUp, Event as EventIcon, Category, LocationOn, Tag as TagIcon, History} from '@mui/icons-material';
import { getSearchSuggestions, SearchSuggestion } from '@/lib/search-client';

interface SearchComponentProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search events, venues, or keywords...",
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const popularSearches = [
    'Concert', 'Comedy', 'Food Festival', 'Theater', 'Sports', 
    'Art', 'Music', 'Dance', 'Technology', 'Networking'
  ];

  useEffect(() => {
    setSearchHistory([]);
  }, []);

  const saveToHistory = (query: string) => {
    if (!query.trim() || query.length < 2) return;
    
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    
  };

  // Fetch suggestions using direct MongoDB access
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const suggestions = await getSearchSuggestions(query, 8);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setSelectedSuggestion(-1);
    
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }
    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSearch = (query: string = value) => {
    if (query.trim()) {
      saveToHistory(query.trim());
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handlePopularClick = (term: string) => {
    onChange(term);
    handleSearch(term);
  };

  const handleHistoryClick = (term: string) => {
    onChange(term);
    handleSearch(term);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    const totalSuggestions = suggestions.length + searchHistory.slice(0, 3).length;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestion(prev => 
          prev < totalSuggestions - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestion(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestion >= 0) {
          if (selectedSuggestion < suggestions.length) {
            handleSuggestionClick(suggestions[selectedSuggestion]);
          } else {
            const historyIndex = selectedSuggestion - suggestions.length;
            const historyItem = searchHistory[historyIndex];
            if (historyItem) {
              handleHistoryClick(historyItem);
            }
          }
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, []);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'event': return <EventIcon fontSize="small" />;
      case 'category': return <Category fontSize="small" />;
      case 'venue': return <LocationOn fontSize="small" />;
      case 'tag': return <TagIcon fontSize="small" />;
      default: return <SearchIcon fontSize="small" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'event': return 'Event';
      case 'category': return 'Category';
      case 'venue': return 'Venue';
      case 'tag': return 'Tag';
      default: return '';
    }
  };

  const shouldShowSuggestions = showSuggestions && (
    suggestions.length > 0 || 
    searchHistory.length > 0 || 
    (!value.trim() && popularSearches.length > 0)
  );

  const recentHistory = searchHistory.slice(0, 3);

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: value && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => {
                  onChange('');
                  setShowSuggestions(false);
                }}
                disabled={disabled}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          }
        }}
      />

      {/* Suggestions Dropdown */}
      <Fade in={shouldShowSuggestions}>
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            maxHeight: 400,
            overflow: 'auto',
            mt: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <List dense sx={{ py: 1 }}>
            {/* Suggestions */}
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={`suggestion-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  ...(selectedSuggestion === index && { backgroundColor: 'action.selected' })
                }}
              >
                <Box sx={{ mr: 2, color: 'action.active' }}>
                  {getSuggestionIcon(suggestion.type)}
                </Box>
                <ListItemText 
                  primary={suggestion.text}
                  secondary={getTypeLabel(suggestion.type)}
                />
              </ListItem>
            ))}

            {/* Search History */}
            {recentHistory.length > 0 && suggestions.length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}
            
            {recentHistory.length > 0 && (
              <>
                {recentHistory.length > 0 && suggestions.length === 0 && (
                  <ListItem>
                    <Box sx={{ mr: 2, color: 'action.active' }}>
                      <History fontSize="small" />
                    </Box>
                    <ListItemText primary="Recent searches" />
                  </ListItem>
                )}
                
                {recentHistory.map((historyItem, index) => (
                  <ListItem
                    key={`history-${index}`}
                    onClick={() => handleHistoryClick(historyItem)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      ...(selectedSuggestion === suggestions.length + index && { backgroundColor: 'action.selected' })
                    }}
                  >
                    <Box sx={{ mr: 2, color: 'action.active' }}>
                      <History fontSize="small" />
                    </Box>
                    <ListItemText primary={historyItem} />
                  </ListItem>
                ))}
              </>
            )}

            {/* Popular Searches */}
            {!value.trim() && suggestions.length === 0 && (
              <>
                <ListItem>
                  <Box sx={{ mr: 2, color: 'action.active' }}>
                    <TrendingUp fontSize="small" />
                  </Box>
                  <ListItemText primary="Popular searches" />
                </ListItem>
                <ListItem>
                  <Box sx={{ width: '100%', px: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {popularSearches.slice(0, 8).map((term) => (
                        <Chip
                          key={term}
                          label={term}
                          size="small"
                          onClick={() => handlePopularClick(term)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </ListItem>
              </>
            )}

            {/* Loading state */}
            {loadingSuggestions && (
              <ListItem>
                <ListItemText primary="Searching..." />
              </ListItem>
            )}

            {/* No results */}
            {value.trim() && suggestions.length === 0 && !loadingSuggestions && (
              <ListItem>
                <ListItemText 
                  primary="No suggestions found"
                  secondary="Try different keywords"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Fade>
    </Box>
  );
};