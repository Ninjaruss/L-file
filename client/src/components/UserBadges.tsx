'use client';

import React, { useState, useEffect } from 'react'
import { Group, Skeleton, ThemeIcon, Text, rem } from '@mantine/core'
import { UserBadge } from '../types'
import { api } from '../lib/api'
import BadgeDisplay from './BadgeDisplay'

interface UserBadgesProps {
  userId: number;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
  className?: string;
}

export default function UserBadges({
  userId,
  size = 'sm',
  maxDisplay = 5,
  className = ''
}: UserBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) {
        setBadges([])
        setLoading(false)
        return
      }

      try {
        const data = await api.getUserBadges(userId)
        const badgesArray = Array.isArray(data) ? data : data?.data || []
        setBadges(badgesArray)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load badges')
        setBadges([])
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [userId])

  const iconSize = size === 'sm' ? rem(24) : size === 'md' ? rem(32) : rem(40)

  if (loading) {
    return (
      <Group gap={rem(8)} className={className}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={iconSize} width={iconSize} radius="xl" />
        ))}
      </Group>
    );
  }

  if (error) {
    return null; // Silently fail for badges
  }

  if (!Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  const sortedBadges = badges.sort((a, b) => {
    if (a.badge.displayOrder !== b.badge.displayOrder) {
      return a.badge.displayOrder - b.badge.displayOrder;
    }
    return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
  });

  const visibleBadges = sortedBadges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <Group gap={rem(8)} align="center" className={className}>
      {visibleBadges.map((userBadge) => (
        <BadgeDisplay
          key={userBadge.id}
          userBadge={userBadge}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <ThemeIcon
          radius="xl"
          variant="filled"
          color="dark"
          size={iconSize}
          title={`+${remainingCount} more badge${remainingCount > 1 ? 's' : ''}`}
        >
          <Text size="xs" fw={500}>+{remainingCount}</Text>
        </ThemeIcon>
      )}
    </Group>
  );
}
