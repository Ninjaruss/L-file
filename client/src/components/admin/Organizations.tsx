import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  FunctionField
} from 'react-admin'
import { Typography } from '@mui/material'

export const OrganizationList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const OrganizationEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={4} 
        helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
      />
    </SimpleForm>
  </Edit>
)

export const OrganizationCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput 
        source="description" 
        multiline 
        rows={4} 
        helperText="Supports Markdown formatting (bold, italic, lists, links, etc.)"
      />
    </SimpleForm>
  </Create>
)