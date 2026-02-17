import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  RadioGroup,
  Switch,
  Typography,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { Review, ReviewStatus } from '@domains/reviews/application/interfaces/Review'
import { UI_COPY, REVIEW_STATUS_OPTIONS } from '@shared/application/config/uiCopy'
import { useReviewFormLogic } from '@domains/reviews/application/hooks/useReviewFormLogic'
import {
  FormContainer,
  FormHeader,
  FormContent,
  FormFooter,
  CommentTextField,
  StatusRadio,
  AnonymousSection,
  CancelButton,
  SubmitButton,
  OptionLabelBox,
  ButtonGroup,
  AnonymousLabelWrapper,
} from './ReviewForm.styled'

interface ReviewFormProps {
  username: string
  onClose?: () => void
  onSuccess?: () => void
  existingReview?: Review
}

export default function ReviewForm({
  username,
  onClose,
  onSuccess,
  existingReview,
}: ReviewFormProps) {
  const theme = useTheme()
  const {
    status,
    setStatus,
    comment,
    setComment,
    anonymous,
    setAnonymous,
    error,
    loading,
    isEditing,
    maxCommentLength,
    submitReview,
  } = useReviewFormLogic({ username, existingReview })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const succeeded = await submitReview()
    if (succeeded) {
      onSuccess?.()
      onClose?.()
    }
  }

  return (
    <FormContainer component='form' onSubmit={handleSubmit}>
      {/* Header */}
      <FormHeader>
        <Typography variant='subtitle2'>
          {isEditing ? UI_COPY.reviewFormEditTitle : UI_COPY.reviewFormCreateTitle}
        </Typography>
        {onClose && (
          <IconButton size='small' onClick={onClose}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </FormHeader>

      {/* Content */}
      <FormContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <CommentTextField
          fullWidth
          multiline
          rows={4}
          placeholder={UI_COPY.reviewFormPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required={status === 'comment'}
          slotProps={{ htmlInput: { maxLength: maxCommentLength } }}
        />
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            textAlign: 'right',
            mt: 0.5,
            color:
              comment.length >= maxCommentLength * 0.96
                ? theme.palette.error.main
                : theme.palette.text.secondary,
          }}
        >
          {comment.length} / {maxCommentLength}
        </Typography>

        <RadioGroup value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus)}>
          {REVIEW_STATUS_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<StatusRadio />}
              label={
                <OptionLabelBox>
                  <Typography variant='body2'>{option.label}</Typography>
                  <Typography variant='caption' sx={{ color: theme.palette.text.secondary }}>
                    {option.description}
                  </Typography>
                </OptionLabelBox>
              }
              sx={{
                alignItems: 'flex-start',
                mb: 1,
                mx: 0,
                '& .MuiFormControlLabel-label': { mt: 0.25 },
              }}
            />
          ))}
        </RadioGroup>

        {/* Anonymous toggle */}
        {!isEditing && (
          <AnonymousSection>
            <FormControlLabel
              control={
                <Switch
                  checked={anonymous}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnonymous(e.target.checked)
                  }
                  disabled={isEditing}
                />
              }
              label={
                <AnonymousLabelWrapper>
                  <Typography variant='body2'>{UI_COPY.reviewFormAnonymous}</Typography>
                </AnonymousLabelWrapper>
              }
              sx={{ mx: 0 }}
            />
          </AnonymousSection>
        )}
      </FormContent>

      {/* Footer */}
      <FormFooter>
        <Box />
        <ButtonGroup>
          {onClose && <CancelButton onClick={onClose}>{UI_COPY.reviewFormCancel}</CancelButton>}
          <SubmitButton type='submit' variant='contained' disabled={loading} sx={{ minWidth: 130 }}>
            {loading ? (
              <CircularProgress size={20} color='inherit' />
            ) : isEditing ? (
              UI_COPY.reviewFormUpdate
            ) : (
              UI_COPY.reviewFormSubmit
            )}
          </SubmitButton>
        </ButtonGroup>
      </FormFooter>
    </FormContainer>
  )
}
