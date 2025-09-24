'use client';

import React, { useState, useEffect } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme';
import { UserBadge, BadgeType } from '../types';
import { api } from '../lib/api';
import { API_BASE_URL } from '../lib/api';

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
  onSelect
}: ProfilePictureSelectorProps) {
  const theme = useMantineTheme();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [characterMedia, setCharacterMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [characterFilter, setCharacterFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user badges
  const badgesResponse = await fetch(`${API_BASE_URL}/users/${currentUserId}/badges`);
        if (badgesResponse.ok) {
          const badges = await badgesResponse.json();
          // Ensure we store an array (API might return null or an object in some cases)
          setUserBadges(Array.isArray(badges) ? badges : (badges?.data && Array.isArray(badges.data) ? badges.data : []));
        }
      } catch (error) {
        console.error('Failed to fetch profile picture data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  const fetchCharacterMedia = async () => {
    setMediaLoading(true);
    try {
      // Use the API client to get approved entity display media for characters
      const response = await api.getApprovedMedia({
        ownerType: 'character',
        purpose: 'entity_display',
        limit: 1000 // Get a large number to show all available
      });

      if (response?.data) {
        // Sort by character name - fix the property access
        const sortedMedia = response.data.sort((a: any, b: any) => {
          const nameA = a.character?.name || 'Unknown Character';
          const nameB = b.character?.name || 'Unknown Character';
          return nameA.localeCompare(nameB);
        });
        setCharacterMedia(sortedMedia);
      }
    } catch (error) {
      console.error('Failed to fetch character media:', error);
    } finally {
      setMediaLoading(false);
    }
  };

  const hasActiveBadge = (requiredBadge: BadgeType): boolean => {
    if (!Array.isArray(userBadges)) return false;
    return userBadges.some(userBadge =>
      userBadge?.badge?.type === requiredBadge &&
      userBadge?.isActive &&
      (!userBadge?.expiresAt || new Date(userBadge.expiresAt) > new Date())
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
        description: 'Choose from character images',
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

    return options;
  };

  const handleOptionSelect = (optionType: string) => {
    setSelectedOption(selectedOption === optionType ? null : optionType);
    
    if (optionType === 'character_media' && characterMedia.length === 0) {
      fetchCharacterMedia();
    }
    
    // If selecting discord or premium (without media selection), call onSelect immediately
    if (optionType === 'discord') {
      onSelect(optionType);
    }
  };

  const handleMediaSelect = (mediaId: number, optionType: string) => {
    onSelect(optionType, mediaId);
    setSelectedOption(null); // Close the media selection
  };

  // Group media by character for better organization
  const groupedCharacterMedia = characterMedia.reduce((groups: { [key: string]: any[] }, media) => {
    const characterName = media.character?.name || 'Unknown Character';
    if (!groups[characterName]) {
      groups[characterName] = [];
    }
    groups[characterName].push(media);
    return groups;
  }, {});

  const filteredCharacterMedia = characterFilter
    ? characterMedia.filter(media => {
        const characterName = media.character?.name || 'Unknown Character';
        return characterName.toLowerCase().includes(characterFilter.toLowerCase());
      })
    : characterMedia;

  // Group filtered media by character
  const filteredGroupedMedia = filteredCharacterMedia.reduce((groups: { [key: string]: any[] }, media) => {
    const characterName = media.character?.name || 'Unknown Character';
    if (!groups[characterName]) {
      groups[characterName] = [];
    }
    groups[characterName].push(media);
    return groups;
  }, {});

  if (loading) {
    return (
      <Card shadow="sm" padding="md" radius="md">
        <Stack gap="md">
          <Skeleton height={24} width="40%" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} />
          ))}
        </Stack>
      </Card>
    );
  }

  const options = getProfileOptions();

  return (
    <Card shadow="sm" padding="md" radius="md">
      <Stack gap="md">
        {options.map((option) => (
          <Box key={option.type}>
            <Box
              p="md"
              style={{
                border: `1px solid ${
                  option.disabled
                    ? 'rgba(255, 255, 255, 0.15)'
                    : currentProfileType === option.type || selectedOption === option.type
                      ? '#e11d48'
                      : 'rgba(255, 255, 255, 0.15)'
                }`,
                backgroundColor: option.disabled
                  ? 'rgba(255, 255, 255, 0.03)'
                  : currentProfileType === option.type || selectedOption === option.type
                    ? 'rgba(225, 29, 72, 0.1)'
                    : 'transparent',
                borderRadius: '6px',
                cursor: option.disabled ? 'not-allowed' : 'pointer',
                opacity: option.disabled ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (!option.disabled) {
                  handleOptionSelect(option.type);
                }
              }}
            >
              <Group justify="space-between">
                <Box>
                  <Text fw={500} size="sm">
                    {option.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {option.description}
                  </Text>
                  {option.requiredBadge && option.disabled && (
                    <Text size="xs" c="red" mt={4}>
                      {option.disabledReason}
                    </Text>
                  )}
                </Box>
                {option.requiredBadge && !option.disabled && (
                  <Badge size="xs" variant="light" color="yellow">
                    Premium
                  </Badge>
                )}
              </Group>
            </Box>

            {/* Character media selection */}
            {(selectedOption === option.type && option.type === 'character_media') && (
              <Box mt="md" p="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">
                      Choose a Character Image
                    </Text>
                    <TextInput
                      placeholder="Search characters..."
                      value={characterFilter}
                      onChange={(e) => setCharacterFilter(e.target.value)}
                      size="xs"
                      style={{ flex: 1, maxWidth: 200 }}
                    />
                  </Group>

                  {mediaLoading ? (
                    <Stack gap="sm">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} height={80} />
                      ))}
                    </Stack>
                  ) : (
                    <Stack gap="md">
                      {Object.keys(filteredGroupedMedia).length > 0 ? (
                        Object.entries(filteredGroupedMedia).map(([characterName, medias]) => (
                          <Box key={characterName}>
                            <Text size="sm" fw={500} c="dimmed" mb="xs">
                              {characterName}
                            </Text>
                            <Stack gap="xs">
                              {medias.map((media: any) => (
                                <Box
                                  key={media.id}
                                  p="xs"
                                  style={{
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onClick={() => handleMediaSelect(media.id, option.type)}
                                >
                                  <Group gap="sm">
                                    <Box
                                      style={{
                                        width: 40,
                                        height: 40,
                                        backgroundImage: `url(${media.url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                      }}
                                    />
                                    <Stack gap={0}>
                                      <Text size="xs" fw={500}>
                                        {media.title || 'Untitled'}
                                      </Text>
                                      <Text size="xs" c="dimmed">
                                        {media.description || 'No description'}
                                      </Text>
                                    </Stack>
                                  </Group>
                                </Box>
                              ))}
                            </Stack>
                          </Box>
                        ))
                      ) : (
                        <Text size="sm" c="dimmed" ta="center">
                          {characterFilter ? 'No character media found matching your search' : 'No character media available'}
                        </Text>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        ))}

        <Alert variant="light" style={{ color: getEntityThemeColor(theme, 'character') }} icon="☕">
          <Stack gap="sm">
            <Text fw={500} size="md">
              Want to unlock more options?
            </Text>
            <Text size="sm">
              Support our fansite to get access to premium profile pictures and exclusive content!
            </Text>
            <Button
              component="a"
              href="https://ko-fi.com/usogui"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="filled"
              style={{ color: getEntityThemeColor(theme, 'character') }}
            >
              ☕ Support on Ko-fi
            </Button>
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
