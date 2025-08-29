import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  ReferenceField,
  BooleanField,
  BooleanInput,
  UrlField
} from 'react-admin'

export const MediaList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <UrlField source="url" />
      <TextField source="description" />
      <BooleanField source="approved" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const MediaShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <UrlField source="url" />
      <TextField source="description" />
      <ReferenceField source="submittedBy" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <BooleanField source="approved" />
      <DateField source="createdAt" />
    </SimpleShowLayout>
  </Show>
)

export const MediaEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="url" required />
      <TextInput source="description" multiline rows={4} />
      <BooleanInput source="approved" />
    </SimpleForm>
  </Edit>
)