import React from 'react'
import { Card, CardContent, CardHeader, Grid, Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetList, usePermissions } from 'react-admin'
import { Link } from 'react-router-dom'
import { Users, BookOpen, Crown, Zap, FileText, Image, Quote, Shield, Plus, ChevronRight } from 'lucide-react'

interface StatCardProps {
  title: string
  count: number | undefined
  icon: React.ComponentType<{ size: number; color: string; style?: React.CSSProperties }>
  color: string
  resource: string
}

const StatCard = ({ title, count, icon: Icon, color, resource }: StatCardProps) => (
  <Link to={`/${resource}`} style={{ textDecoration: 'none' }}>
    <Card sx={{
      height: '100%',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${color}40`,
        borderColor: color
      },
      border: '1px solid transparent'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>
              {count || 0}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Icon size={40} color={color} style={{ opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  </Link>
)

interface QuickActionProps {
  text: string
  to: string
  filter?: Record<string, string>
  icon?: React.ComponentType<{ size: number }>
}

const QuickActionItem = ({ text, to, filter, icon: Icon = ChevronRight }: QuickActionProps) => {
  // Build the path with proper React Admin filter format
  const getPath = () => {
    if (filter) {
      const filterParam = encodeURIComponent(JSON.stringify(filter))
      return `${to}?displayedFilters=${filterParam}&filter=${filterParam}&order=ASC&page=1&perPage=25&sort=id`
    }
    return to
  }

  return (
    <Link
      to={getPath()}
      style={{ textDecoration: 'none' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          mb: 1,
          borderRadius: 1,
          backgroundColor: 'rgba(225, 29, 72, 0.05)',
          border: '1px solid rgba(225, 29, 72, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(225, 29, 72, 0.1)',
            borderColor: 'rgba(225, 29, 72, 0.3)',
            transform: 'translateX(4px)'
          }
        }}
      >
        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
          {text}
        </Typography>
        <Icon size={20} />
      </Box>
    </Link>
  )
}

export const Dashboard = () => {
  const { permissions } = usePermissions()
  const theme = useTheme()

  const { total: charactersCount } = useGetList('characters', { pagination: { page: 1, perPage: 1 } })
  const { total: arcsCount } = useGetList('arcs', { pagination: { page: 1, perPage: 1 } })
  const { total: gamblesCount } = useGetList('gambles', { pagination: { page: 1, perPage: 1 } })
  const { total: eventsCount } = useGetList('events', { pagination: { page: 1, perPage: 1 } })
  const { total: guidesCount } = useGetList('guides', { pagination: { page: 1, perPage: 1 } })
  const { total: mediaCount } = useGetList('media', { pagination: { page: 1, perPage: 1 } })
  const { total: quotesCount } = useGetList('quotes', { pagination: { page: 1, perPage: 1 } })
  // Only fetch users count for admins (the endpoint is admin-only)
  const { total: usersCount } = useGetList('users', { pagination: { page: 1, perPage: 1 } }, { enabled: permissions === 'admin' })

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the L-file Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage all content and users for the Usogui fansite. Click on any card to view and manage that content.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Characters"
            count={charactersCount}
            icon={Users}
            color={theme.palette.usogui.character}
            resource="characters"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Story Arcs"
            count={arcsCount}
            icon={BookOpen}
            color={theme.palette.usogui.arc}
            resource="arcs"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gambles"
            count={gamblesCount}
            icon={Crown}
            color={theme.palette.usogui.gamble}
            resource="gambles"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Events"
            count={eventsCount}
            icon={Zap}
            color={theme.palette.usogui.event}
            resource="events"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Community Guides"
            count={guidesCount}
            icon={FileText}
            color={theme.palette.usogui.guide}
            resource="guides"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Media Submissions"
            count={mediaCount}
            icon={Image}
            color={theme.palette.usogui.media}
            resource="media"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quotes"
            count={quotesCount}
            icon={Quote}
            color={theme.palette.usogui.quote}
            resource="quotes"
          />
        </Grid>
        {permissions === 'admin' && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Users"
              count={usersCount}
              icon={Shield}
              color={theme.palette.text.secondary}
              resource="users"
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(225, 29, 72, 0.2)'
          }}>
            <CardHeader
              title="Quick Actions"
              sx={{
                borderBottom: '1px solid rgba(225, 29, 72, 0.2)',
                '& .MuiCardHeader-title': {
                  color: '#e11d48',
                  fontWeight: 'bold'
                }
              }}
            />
            <CardContent>
              <QuickActionItem
                text="Review pending guides"
                to="/guides"
                filter={{ status: 'pending' }}
              />
              <QuickActionItem
                text="Moderate media submissions"
                to="/media"
                filter={{ status: 'pending' }}
              />
              <QuickActionItem
                text="Review pending events"
                to="/events"
                filter={{ status: 'pending' }}
              />
              <QuickActionItem
                text="Review pending annotations"
                to="/annotations"
                filter={{ status: 'pending' }}
              />
              <QuickActionItem
                text="Add new character"
                to="/characters/create"
                icon={Plus}
              />
              <QuickActionItem
                text="Add new story arc"
                to="/arcs/create"
                icon={Plus}
              />
              {permissions === 'admin' && (
                <QuickActionItem
                  text="Manage user accounts"
                  to="/users"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{
            backgroundColor: '#0a0a0a',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}>
            <CardHeader
              title="Content Guidelines"
              sx={{
                borderBottom: '1px solid rgba(124, 58, 237, 0.2)',
                '& .MuiCardHeader-title': {
                  color: '#7c3aed',
                  fontWeight: 'bold'
                }
              }}
            />
            <CardContent>
              <Box sx={{
                p: 2,
                mb: 1,
                borderRadius: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.1)'
              }}>
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 1 }}>
                  <strong>Accuracy:</strong> Ensure all content is accurate to the source material
                </Typography>
              </Box>
              <Box sx={{
                p: 2,
                mb: 1,
                borderRadius: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.1)'
              }}>
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 1 }}>
                  <strong>Spoilers:</strong> Mark spoiler content with appropriate chapter numbers
                </Typography>
              </Box>
              <Box sx={{
                p: 2,
                mb: 1,
                borderRadius: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.1)'
              }}>
                <Typography variant="body1" sx={{ color: '#ffffff', mb: 1 }}>
                  <strong>Media:</strong> Verify media submissions for copyright compliance
                </Typography>
              </Box>
              <Box sx={{
                p: 2,
                borderRadius: 1,
                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                border: '1px solid rgba(124, 58, 237, 0.1)'
              }}>
                <Typography variant="body1" sx={{ color: '#ffffff' }}>
                  <strong>Quality:</strong> Maintain consistent formatting and quality standards
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
