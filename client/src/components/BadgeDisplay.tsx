'use client';

import React from 'react';
import { Tooltip, Chip } from '@mui/material';
import { UserBadge, BadgeType } from '../types';

interface BadgeDisplayProps {
  userBadge: UserBadge;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export default function BadgeDisplay({
  userBadge,
  size = 'md',
  showTooltip = true,
  className = ''
}: BadgeDisplayProps) {
  const { badge } = userBadge;

  const getChipSize = () => {
    switch (size) {
      case 'sm': return 'small';
      case 'md': return 'medium';
      case 'lg': return 'medium'; // Material-UI doesn't have 'large', use medium
      default: return 'small';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDisplayName = () => {
    if (badge.type === BadgeType.SUPPORTER && userBadge.year) {
      return `${badge.name} ${userBadge.year}`;
    }
    return badge.name;
  };

  const getTooltipContent = () => {
    const isExpired = userBadge.expiresAt && new Date(userBadge.expiresAt) < new Date();
    const isActive = userBadge.isActive;
    
    const content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {getDisplayName()}
        </div>
        <div style={{ marginBottom: '4px' }}>
          {badge.description}
        </div>
        
        {/* Status indicators */}
        {!isActive && (
          <div style={{ fontSize: '0.875rem', color: '#f44336', fontWeight: 'bold' }}>
            REMOVED
          </div>
        )}
        {isExpired && (
          <div style={{ fontSize: '0.875rem', color: '#ff9800', fontWeight: 'bold' }}>
            EXPIRED
          </div>
        )}
        
        <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
          Awarded: {formatDate(userBadge.awardedAt)}
        </div>
        {userBadge.expiresAt && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {isExpired ? 'Expired' : 'Expires'}: {formatDate(userBadge.expiresAt)}
          </div>
        )}
        {userBadge.revokedAt && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, color: '#f44336' }}>
            Removed: {formatDate(userBadge.revokedAt)}
          </div>
        )}
        {userBadge.reason && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, fontStyle: 'italic' }}>
            Reason: {userBadge.reason}
          </div>
        )}
        {userBadge.revokedReason && (
          <div style={{ fontSize: '0.875rem', opacity: 0.8, fontStyle: 'italic', color: '#f44336' }}>
            Removal reason: {userBadge.revokedReason}
          </div>
        )}
      </div>
    );
    return content;
  };

  const badgeElement = (
    <Chip
      label={getDisplayName()}
      size={getChipSize()}
      variant="outlined"
      className={className}
      sx={{
        borderColor: badge.color,
        color: badge.color,
        backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}33` : 'transparent',
        fontWeight: 600,
        fontSize: size === 'sm' ? '0.6875rem' : size === 'md' ? '0.75rem' : '0.8125rem',
        '&:hover': {
          backgroundColor: badge.backgroundColor ? `${badge.backgroundColor}44` : `${badge.color}11`,
          borderColor: badge.color,
          transform: 'scale(1.02)'
        },
        '& .MuiChip-label': {
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
          fontWeight: 600
        }
      }}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip
        title={getTooltipContent()}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              maxWidth: 300,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              fontSize: '0.875rem',
              padding: '8px 12px'
            }
          }
        }}
      >
        {badgeElement}
      </Tooltip>
    );
  }

  return badgeElement;
}