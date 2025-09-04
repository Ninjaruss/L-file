'use client'

import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Link,
  Paper 
} from '@mui/material'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string | React.ReactNode
}

const faqData: FAQItem[] = [
  {
    question: "What is L-file?",
    answer: "L-file is an unofficial fan database for the manga series 'Usogui' (Lie Eater) by Sako Toshio. We provide comprehensive information about characters, story arcs, gambling games, and more to help fans explore and understand this complex series."
  },
  {
    question: "Where can I read Usogui?",
    answer: 
    <>
      <p>We understand the desire to read this incredible series! Unfortunately, there is <b>no official English license or release for Usogui</b>. This means no official digital chapters on apps like Viz Manga or Manga Plus, and no official physical volumes in English.
      For this reason, the primary way the international community has accessed Usogui has been through fan translations.</p>

      <p>The most complete and well-regarded fan translation was done by Team Duwang. Their work was instrumental in bringing Usogui to a global audience. You can search for "Team Duwang Usogui" online to find their releases.</p>

      <Box sx={{ p: 2, mb: 2, borderLeft: '4px solid', borderColor: 'primary.main', bgcolor: 'rgba(25,118,210,0.06)', borderRadius: 1 }}>
        <Typography variant="body2" color="text.primary">
          The best way to support Sako-sensei is to purchase the official Japanese volumes if you are able. This shows the publisher there is international interest and could one day help motivate an official English release.

          Another way to support Sako-sensei is by reading his most recent work that is available officially in English:
        </Typography>
        <Link
          href="https://mangaplus.shueisha.co.jp/titles/100507"
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              component="img"
              src="https://jumpg-assets.tokyo-cdn.com/secure/title/100507/title_thumbnail_portrait_list/424427.jpg?hash=4NSvp5UuCWBI_jZFPFggbg&expires=2145884400"
              alt="Genikasuri (Pocketeer) thumbnail"
              sx={{
                width: 96,
                height: 136,
                objectFit: 'cover',
                borderRadius: 1,
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
              loading="lazy"
            />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                Genikasuri (Pocketeer)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View on Manga Plus
              </Typography>
            </Box>
          </Box>
        </Link>
      </Box>

      

      <p>This fan site is not affiliated with any scanlation group. We provide this information for educational and informational purposes only. We encourage all fans to support the official release should it ever become available in their region.</p>
    </>
  },
  {
    question: "Is this website officially affiliated with the creators?",
    answer: "No, L-file is an independent fan project and is not officially affiliated with Sako Toshio, Shueisha, or any official Usogui publishers. This is a fan-made resource created by and for the Usogui community."
  },
  {
    question: "Can I contribute content to L-file?",
    answer: (
      <>
        Yes! Registered users can contribute guides and submit fanart/videos through media submissions.  
        You can <Link href="/register" color="primary">create an account</Link> to start contributing. 
        All submissions are moderated to maintain quality and accuracy. If you would like to help with data entry, please join the
        <Link href="https://discord.gg/JXeRhV2qpY" color="primary"> Discord</Link>  community.
      </>
    )
  },
  {
    question: "Does this website contain spoilers?",
    answer: "Yes, L-file contains detailed information about the entire Usogui series, including major plot points, character developments, and story outcomes. Although chapter progress can be set to hide spoilers, we recommend completing the manga before browsing if you want to avoid spoilers."
  },
  {
    question: "How do I track my reading progress?",
    answer: (
      <>
        After <Link href="/register" color="primary">creating an account</Link>, you can mark chapters 
        as read using the chapter button on the bottom right of the screen. Your progress is saved and synced across devices 
        when you're logged in. Chapter progress is also tracked locally, so you can keep track even without an account.
      </>
    )
  },
  {
    question: "What makes Usogui special?",
    answer: "Usogui stands out for its incredibly detailed gambling games, complex psychological warfare, intricate plot threads, and masterful artwork. It's considered one of the most intellectually challenging manga series, combining elements of thriller, psychological drama, and strategic gaming."
  },
  {
    question: "Are there content warnings I should know about?",
    answer: "Yes, Usogui contains mature content including violence, psychological manipulation, gambling addiction themes, and occasional adult situations. The series is intended for mature audiences and deals with heavy psychological themes."
  },
  {
    question: "How can I contact the L-file team?",
    answer: (
      <>
        You can reach us via email at{' '}
        <Link href="mailto:ninjarussyt@gmail.com" color="primary">ninjarussyt@gmail.com</Link>{' '}
        or join our{' '}
        <Link href="https://discord.gg/JXeRhV2qpY" target="_blank" rel="noopener noreferrer" color="primary">
          Discord community
        </Link>{' '}
        for discussions and support.
      </>
    )
  },
  {
    question: "Is L-file mobile-friendly?",
    answer: "Yes, L-file is designed to work seamlessly across all devices including smartphones, tablets, and desktops. The interface adapts to your screen size for optimal browsing experience."
  }
]

interface FAQProps {
  showTitle?: boolean
  maxItems?: number
}

export const FAQ: React.FC<FAQProps> = ({ showTitle = true, maxItems }) => {
  const [expanded, setExpanded] = useState<string | false>(false)

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const itemsToShow = maxItems ? faqData.slice(0, maxItems) : faqData

  return (
    <Box>
      {showTitle && (
        <Box textAlign="center" mb={4}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
            <HelpCircle className="w-6 h-6" color="#1976d2" />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              Frequently Asked Questions
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Common questions about L-file and the Usogui series
          </Typography>
        </Box>
      )}
      
      <Paper elevation={1} sx={{ p: 2 }}>
        {itemsToShow.map((faq, index) => (
          <Accordion
            key={index}
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              '&:not(:last-child)': { mb: 1 },
              borderRadius: 1
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown className="w-5 h-5" />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center'
                }
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" color="text.secondary" component="div">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  )
}