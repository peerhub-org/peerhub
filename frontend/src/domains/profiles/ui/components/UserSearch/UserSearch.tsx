import { Search, Close } from '@mui/icons-material'
import {
  Avatar,
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { usePostHog } from '@posthog/react'
import { UserSearchResult } from '@domains/profiles/application/interfaces/User'
import profileService from '@domains/profiles/application/services/profileService'
import {
  SEARCH_DEBOUNCE_MS,
  USER_SEARCH_FOCUS_DELAY_MS,
} from '@shared/application/config/appConstants'
import { UI_COPY } from '@shared/application/config/uiCopy'
import { useDebouncedValue } from '@shared/application/hooks/useDebouncedValue'
import {
  SearchContainer,
  SearchTrigger,
  SearchCard,
  SearchInput,
  ResultsArea,
  ResultsList,
  StatusText,
} from './UserSearch.styled'

export default function UserSearch() {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<UserSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const latestSearchIdRef = useRef(0)
  const debouncedInputValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS)

  const searchUsers = useCallback(
    async (query: string) => {
      const searchId = ++latestSearchIdRef.current
      if (!query || query.length < 2) {
        setOptions([])
        setHasSearched(false)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const results = await profileService.searchUsers(query)
        if (searchId !== latestSearchIdRef.current) return
        setOptions(results)
        setHasSearched(true)
        posthog?.capture('user_search_performed', {
          query_length: query.length,
          results_count: results.length,
        })
      } catch {
        if (searchId !== latestSearchIdRef.current) return
        setOptions([])
        setHasSearched(true)
      } finally {
        if (searchId === latestSearchIdRef.current) {
          setLoading(false)
        }
      }
    },
    [posthog],
  )

  useEffect(() => {
    searchUsers(debouncedInputValue)
  }, [debouncedInputValue, searchUsers])

  useEffect(() => {
    if (open) {
      const timeoutId = window.setTimeout(
        () => inputRef.current?.focus(),
        USER_SEARCH_FOCUS_DELAY_MS,
      )
      return () => window.clearTimeout(timeoutId)
    }
  }, [open])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [options])

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    latestSearchIdRef.current += 1
    setOpen(false)
    setInputValue('')
    setOptions([])
    setHasSearched(false)
    setHighlightedIndex(-1)
  }

  const handleSelect = (user: UserSearchResult) => {
    posthog?.capture('user_search_result_clicked', { selected_username: user.login })
    navigate(`/${user.login}`)
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
      return
    }
    if (options.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(options[highlightedIndex])
    }
  }

  return (
    <SearchContainer>
      <SearchTrigger
        onClick={handleOpen}
        role='combobox'
        aria-expanded={open}
        aria-haspopup='listbox'
        aria-label={UI_COPY.searchUsersLabel}
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen()
          }
        }}
      >
        <Search sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {UI_COPY.searchUsersPlaceholder}
        </Typography>
      </SearchTrigger>

      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <SearchCard elevation={8}>
            <SearchInput
              fullWidth
              placeholder={UI_COPY.searchUsersPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
              autoComplete='off'
              aria-label={UI_COPY.searchUsersLabel}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search fontSize='small' sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      {loading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <IconButton
                          size='small'
                          onClick={handleClose}
                          edge='end'
                          aria-label='Close search'
                        >
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />

            <ResultsArea>
              {options.length > 0 ? (
                <ResultsList role='listbox' aria-label='Search results'>
                  {options.map((user, index) => (
                    <ListItemButton
                      key={user.login}
                      role='option'
                      aria-selected={index === highlightedIndex}
                      selected={index === highlightedIndex}
                      onClick={() => handleSelect(user)}
                      sx={{ borderRadius: 1, py: 0.5 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={user.avatar_url}
                          sx={{ width: 24, height: 24, fontSize: '0.65rem' }}
                        >
                          {user.login.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.login}
                        primaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItemButton>
                  ))}
                </ResultsList>
              ) : hasSearched && !loading ? (
                <StatusText>{UI_COPY.searchUsersNoResults}</StatusText>
              ) : null}
            </ResultsArea>
          </SearchCard>
        </ClickAwayListener>
      )}
    </SearchContainer>
  )
}
