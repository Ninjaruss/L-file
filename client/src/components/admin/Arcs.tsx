import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  NumberInput,
  NumberField,
  FunctionField
} from 'react-admin'
import { Typography } from '@mui/material'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'
import { EditToolbar } from './EditToolbar'

export const ArcList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const ArcShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <FunctionField 
        label="Description" 
        render={(record: any) => 
          record.description ? (
            <EnhancedSpoilerMarkdown
              content={record.description}
              className="admin-description"
              enableEntityEmbeds={true}
              compactEntityCards={true}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No description
            </Typography>
          )
        }
      />
      <NumberField source="startChapter" />
      <NumberField source="endChapter" />
    </SimpleShowLayout>
  </Show>
)

export const ArcEdit = () => (
  <Edit>
    <SimpleForm 
      toolbar={<EditToolbar 
        resource="arcs"
        confirmTitle="Delete Arc"
        confirmMessage="Are you sure you want to delete this arc? This will remove all associated data and cannot be undone."
      />}
    >
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={4} 
        helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
      />
      <NumberInput source="startChapter" required />
      <NumberInput source="endChapter" required />
    </SimpleForm>
  </Edit>
)

export const ArcCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={4} 
        helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
      />
      <NumberInput source="startChapter" required />
      <NumberInput source="endChapter" required />
    </SimpleForm>
  </Create>
)