import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  ArrayField,
  ChipField,
  SingleFieldList,
  Edit,
  Create,
  Show,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  SelectInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  TabbedForm,
  FormTab,
  BooleanField,
  DateField,
  ReferenceField,
  useEditController,
  useRecordContext,
  useRedirect
} from 'react-admin'
import { Box, Typography, Divider, Card, CardContent } from '@mui/material'




export const GambleList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="chapterId" label="Chapter ID" />
      <ArrayField source="participants" label="Participants">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <SimpleShowLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField source="id" label="Gamble ID" />
        <TextField source="name" label="Gamble Name" />
        <TextField source="chapterId" label="Chapter ID" />
        </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Game Details</Typography>
        <Divider sx={{ mb: 2 }} />
        <TextField source="rules" />
        <TextField source="winCondition" />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Participants</Typography>
        <Divider sx={{ mb: 2 }} />
        <ArrayField source="participants" label="Participants">
          <SingleFieldList linkType={false}>
            <ChipField source="name" size="small" />
          </SingleFieldList>
        </ArrayField>
      </Box>


      <Box>
        <Typography variant="h6" gutterBottom>Metadata</Typography>
        <Divider sx={{ mb: 2 }} />
        <DateField source="createdAt" />
        <DateField source="updatedAt" />
      </Box>
    </SimpleShowLayout>
  </Show>
)

const GambleEditForm = () => {
  const { record, isLoading } = useEditController()
  
  if (isLoading || !record) return null

  // Transform record to include participantIds for the form
  const transformedRecord = {
    ...record,
    participantIds: record.participants ? record.participants.map((p: any) => p.id) : []
  }

  return (
    <TabbedForm
      record={transformedRecord}
      sanitizeEmptyValues={false}
    >
      <FormTab label="Basic Info">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Gamble Information
          </Typography>
          <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
          <NumberInput 
            source="chapterId" 
            label="Chapter Number" 
            required 
            min={1}
            max={539} 
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ mb: 2 }}
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Rules & Conditions
          </Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works"
            sx={{ mb: 3 }}
          />
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble"
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Participants
          </Typography>
          <ReferenceArrayInput source="participantIds" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who participated in this gamble"
              noOptionsText="No characters available"
            />
          </ReferenceArrayInput>
        </Box>

      </FormTab>

      </TabbedForm>
  )
}

export const GambleEdit = () => {
  // Data transformation is no longer needed as we're directly using participantIds
  return (
    <Edit>
      <GambleEditForm />
    </Edit>
  )
}

export const GambleCreate = () => {
  // Data transformation is no longer needed as we're directly using participantIds
  return (
    <Create>
      <TabbedForm>
      <FormTab label="Basic Info">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            New Gamble Information
          </Typography>
          <TextInput source="name" required fullWidth sx={{ mb: 2 }} />
          <NumberInput 
            source="chapterId" 
            label="Chapter Number" 
            required 
            min={1}
            max={539} 
            helperText="Chapter where this gamble occurs (1-539)"
            sx={{ mb: 2 }}
          />
        </Box>
      </FormTab>

      <FormTab label="Game Rules">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Rules & Conditions
          </Typography>
          <TextInput 
            source="rules" 
            multiline 
            rows={8} 
            required 
            fullWidth
            label="Game Rules"
            helperText="Detailed explanation of how the gamble works"
            sx={{ mb: 3 }}
          />
          <TextInput 
            source="winCondition" 
            multiline 
            rows={4}
            fullWidth
            label="Win Conditions"
            helperText="What determines victory in this gamble (optional)"
          />
        </Box>
      </FormTab>

      <FormTab label="Participants">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Game Participants
          </Typography>
          <ReferenceArrayInput source="participantIds" reference="characters">
            <AutocompleteArrayInput 
              optionText="name" 
              helperText="Characters who participated in this gamble"
              noOptionsText="No characters available"
            />
          </ReferenceArrayInput>
        </Box>
      </FormTab>
    </TabbedForm>
  </Create>
  )
}