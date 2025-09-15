import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextInput,
  FunctionField
} from 'react-admin'
import { Typography } from '@mui/material'
import EnhancedSpoilerMarkdown from '../EnhancedSpoilerMarkdown'

export const TagList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const TagShow = () => (
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
    </SimpleShowLayout>
  </Show>
)

export const TagEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={2} 
        helperText="Supports Markdown formatting"
      />
    </SimpleForm>
  </Edit>
)

export const TagCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={2} 
        helperText="Supports Markdown formatting"
      />
    </SimpleForm>
  </Create>
)