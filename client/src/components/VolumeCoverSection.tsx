'use client'

import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { motion } from 'motion/react'
import Image from 'next/image'

export function VolumeCoverSection() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: '500px', md: '600px' },
        width: '100%',
        perspective: '1200px',
        mb: 6,
        overflow: 'visible'
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        textAlign="center"
        sx={{
          fontWeight: 'bold',
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.usogui.character}, ${theme.palette.usogui.arc})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}
      >
        Featured Volumes
      </Typography>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: '80%',
          gap: { xs: 0, md: 1 }
        }}
      >
        {/* Volume 37 */}
        <motion.div
          initial={{ opacity: 0, x: -100, rotateY: 15, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            zIndex: 1
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '200px', md: '280px', lg: '320px' },
              height: { xs: '280px', md: '400px', lg: '460px' },
              cursor: 'pointer',
              transform: 'rotateY(-5deg)',
              transformStyle: 'preserve-3d',
              '&:hover': {
                transform: 'rotateY(0deg) scale(1.08) translateZ(20px)',
                transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '& .popout-37': {
                  opacity: 1,
                  transform: 'translateY(-60px) translateZ(120px) scale(1.2) rotateX(-10deg)',
                  transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }
              }
            }}
          >
            <Image
              src="/assets/Usogui_Volume_37_background.png"
              alt="Usogui Volume 37"
              fill
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))'
              }}
            />
            
            {/* Volume 37 Pop-out Character */}
            <motion.div
              className="popout-37"
              initial={{ opacity: 0, y: 30, z: -50, scale: 0.6, rotateX: 20 }}
              animate={{ opacity: 0.9, y: -30, z: 60, scale: 1.1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 0.8, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                transform: 'translateY(-30px) translateZ(60px) scale(1.1)',
                zIndex: 10,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d',
                transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <Image
                src="/assets/Usogui_Volume_37_popout.png"
                alt="Volume 37 Character"
                fill
                style={{
                  filter: 'drop-shadow(6px 6px 16px rgba(0, 0, 0, 0.5))',
                  objectFit: 'contain'
                }}
              />
            </motion.div>
          </Box>
        </motion.div>

        {/* Volume 38 */}
        <motion.div
          initial={{ opacity: 0, x: 100, rotateY: -15, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
            zIndex: 1,
            marginLeft: '-15px'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '200px', md: '280px', lg: '320px' },
              height: { xs: '280px', md: '400px', lg: '460px' },
              cursor: 'pointer',
              transform: 'rotateY(5deg)',
              transformStyle: 'preserve-3d',
              '&:hover': {
                transform: 'rotateY(0deg) scale(1.08) translateZ(20px)',
                transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '& .popout-38': {
                  opacity: 1,
                  transform: 'translateY(-60px) translateZ(120px) scale(1.2) rotateX(-10deg)',
                  transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }
              }
            }}
          >
            <Image
              src="/assets/Usogui_Volume_38_background.png"
              alt="Usogui Volume 38"
              fill
              style={{
                objectFit: 'contain',
                filter: 'drop-shadow(12px 12px 24px rgba(0, 0, 0, 0.4))'
              }}
            />

            {/* Volume 38 Pop-out Character */}
            <motion.div
              className="popout-38"
              initial={{ opacity: 0, y: 30, z: -50, scale: 0.6, rotateX: 20 }}
              animate={{ opacity: 0.9, y: -30, z: 60, scale: 1.1, rotateX: 0 }}
              transition={{ duration: 1.5, delay: 1.0, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                transform: 'translateY(-30px) translateZ(60px) scale(1.1)',
                zIndex: 10,
                pointerEvents: 'none',
                transformStyle: 'preserve-3d',
                transition: 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <Image
                src="/assets/Usogui_Volume_38_popout.png"
                alt="Volume 38 Character"
                fill
                style={{
                  filter: 'drop-shadow(6px 6px 16px rgba(0, 0, 0, 0.5))',
                  objectFit: 'contain'
                }}
              />
            </motion.div>
          </Box>
        </motion.div>

        {/* Enhanced floating particles effect */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3 + (i * 0.5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4
            }}
            style={{
              position: 'absolute',
              top: `${20 + (i * 10)}%`,
              left: `${15 + (i * 12)}%`,
              width: `${3 + (i % 3)}px`,
              height: `${3 + (i % 3)}px`,
              borderRadius: '50%',
              backgroundColor: [
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.warning.main,
                theme.palette.error.main,
                theme.palette.usogui.character,
                theme.palette.usogui.arc
              ][i % 6],
              zIndex: 0
            }}
          />
        ))}
      </Box>

      <Typography
        variant="body1"
        textAlign="center"
        color="text.secondary"
        sx={{ 
          mt: 3, 
          fontStyle: 'italic',
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        Hover over the volumes to see the characters come to life
      </Typography>
    </Box>
  )
}