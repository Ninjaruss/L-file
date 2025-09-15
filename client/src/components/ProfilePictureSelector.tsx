'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge, BadgeType } from '../types';

interface ProfilePictureOption {
  type: string;
  label: string;
  description: string;
  requiredBadge?: BadgeType;
  mediaId?: number;
  mediaUrl?: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface ProfilePictureSelectorProps {
  currentUserId: number;
  currentProfileType: string;
  currentSelectedMediaId?: number | null;
  onSelect: (type: string, mediaId?: number) => void;
}

export default function ProfilePictureSelector({
  currentUserId,
  currentProfileType,
  currentSelectedMediaId,
  onSelect
}: ProfilePictureSelectorProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [availableMedia, setAvailableMedia] = useState<any[]>([]);
  const [premiumMedia, setPremiumMedia] = useState<any[]>([]);
  const [exclusiveMedia, setExclusiveMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user badges
        const badgesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${currentUserId}/badges`);
        if (badgesResponse.ok) {
          const badges = await badgesResponse.json();
          setUserBadges(badges);
        }

        // Fetch available media (this would need to be implemented in your API)
        // For now, we'll mock some data
        const mockPremiumMedia = [
          { id: 1, url: '/premium/baku1.jpg', description: 'Premium Baku Portrait' },
          { id: 2, url: '/premium/marco1.jpg', description: 'Premium Marco Portrait' },
        ];

        const mockExclusiveMedia = [
          { id: 101, url: '/exclusive/baku_art.jpg', description: 'Exclusive Baku Artwork' },
          { id: 102, url: '/exclusive/usogui_logo.jpg', description: 'Exclusive Logo Design' },
        ];

        setPremiumMedia(mockPremiumMedia);
        setExclusiveMedia(mockExclusiveMedia);

      } catch (error) {
        console.error('Failed to fetch profile picture data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  const hasActiveBadge = (requiredBadge: BadgeType): boolean => {
    return userBadges.some(userBadge =>
      userBadge.badge.type === requiredBadge &&
      userBadge.isActive &&
      (!userBadge.expiresAt || new Date(userBadge.expiresAt) > new Date())
    );
  };

  const getProfileOptions = (): ProfilePictureOption[] => {
    const options: ProfilePictureOption[] = [
      {
        type: 'discord',
        label: 'Discord Avatar',
        description: 'Use your Discord profile picture',
      },
      {
        type: 'character_media',
        label: 'Character Media',
        description: 'Choose from public character images',
      },
    ];

    // Premium character media (for supporters)
    if (hasActiveBadge(BadgeType.SUPPORTER) || hasActiveBadge(BadgeType.ACTIVE_SUPPORTER) || hasActiveBadge(BadgeType.SPONSOR)) {
      options.push({
        type: 'premium_character_media',
        label: 'Premium Character Media',
        description: 'Exclusive high-quality character images',
        requiredBadge: BadgeType.SUPPORTER,
      });
    } else {
      options.push({
        type: 'premium_character_media',
        label: 'Premium Character Media',
        description: 'Exclusive high-quality character images (Supporters only)',
        requiredBadge: BadgeType.SUPPORTER,
        disabled: true,
        disabledReason: 'Requires Supporter badge',
      });
    }

    // Animated avatars (for active supporters)
    if (hasActiveBadge(BadgeType.ACTIVE_SUPPORTER)) {
      options.push({
        type: 'animated_avatar',
        label: 'Animated Avatar',
        description: 'GIF animations and moving images',
        requiredBadge: BadgeType.ACTIVE_SUPPORTER,
      });
    } else {
      options.push({
        type: 'animated_avatar',
        label: 'Animated Avatar',
        description: 'GIF animations and moving images (Active Supporters only)',
        requiredBadge: BadgeType.ACTIVE_SUPPORTER,
        disabled: true,
        disabledReason: 'Requires Active Supporter badge',
      });
    }

    // Custom frames (for active supporters)
    if (hasActiveBadge(BadgeType.ACTIVE_SUPPORTER)) {
      options.push({
        type: 'custom_frame',
        label: 'Custom Frame',
        description: 'Special border frames around your avatar',
        requiredBadge: BadgeType.ACTIVE_SUPPORTER,
      });
    } else {
      options.push({
        type: 'custom_frame',
        label: 'Custom Frame',
        description: 'Special border frames around your avatar (Active Supporters only)',
        requiredBadge: BadgeType.ACTIVE_SUPPORTER,
        disabled: true,
        disabledReason: 'Requires Active Supporter badge',
      });
    }

    // Exclusive artwork (for sponsors)
    if (hasActiveBadge(BadgeType.SPONSOR)) {
      options.push({
        type: 'exclusive_artwork',
        label: 'Exclusive Artwork',
        description: 'Custom commissioned artwork for sponsors',
        requiredBadge: BadgeType.SPONSOR,
      });
    } else {
      options.push({
        type: 'exclusive_artwork',
        label: 'Exclusive Artwork',
        description: 'Custom commissioned artwork for sponsors (Sponsors only)',
        requiredBadge: BadgeType.SPONSOR,
        disabled: true,
        disabledReason: 'Requires Sponsor badge ($25+ total donations)',
      });
    }

    return options;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const options = getProfileOptions();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Profile Picture Options
      </h3>

      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.type}
            className={`
              p-4 border rounded-lg cursor-pointer transition-all
              ${option.disabled
                ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                : currentProfileType === option.type
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }
            `}
            onClick={() => {
              if (!option.disabled) {
                onSelect(option.type, option.mediaId);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </h4>
                  {option.requiredBadge && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${hasActiveBadge(option.requiredBadge)
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }
                    `}>
                      {option.requiredBadge === BadgeType.SUPPORTER && '💎 Supporter'}
                      {option.requiredBadge === BadgeType.ACTIVE_SUPPORTER && '⭐ Active'}
                      {option.requiredBadge === BadgeType.SPONSOR && '👑 Sponsor'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
                {option.disabled && option.disabledReason && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {option.disabledReason}
                  </p>
                )}
              </div>

              {currentProfileType === option.type && (
                <div className="text-blue-600 dark:text-blue-400">
                  ✓
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
          Want to unlock more options?
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Support our fansite to get access to premium profile pictures and exclusive content!
        </p>
        <a
          href="https://ko-fi.com/usogui" // Replace with your actual Ko-fi link
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          ☕ Support on Ko-fi
        </a>
      </div>
    </div>
  );
}