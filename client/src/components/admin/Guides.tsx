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
  BooleanInput
} from 'react-admin'

export const GuideList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <ReferenceField source="authorId" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <BooleanField source="published" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const GuideShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="content" />
      <ReferenceField source="authorId" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <BooleanField source="published" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
)

export const GuideEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="content" multiline rows={12} required />
      <BooleanInput source="published" />
    </SimpleForm>
  </Edit>
)