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
  SimpleShowLayout
} from 'react-admin'

export const QuoteList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="text" />
      <TextField source="character" />
      <TextField source="context" />
    </Datagrid>
  </List>
)

export const QuoteShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="text" />
      <TextField source="character" />
      <TextField source="context" />
    </SimpleShowLayout>
  </Show>
)

export const QuoteEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="text" multiline rows={4} required />
      <TextInput source="character" required />
      <TextInput source="context" multiline rows={2} />
    </SimpleForm>
  </Edit>
)

export const QuoteCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="text" multiline rows={4} required />
      <TextInput source="character" required />
      <TextInput source="context" multiline rows={2} />
    </SimpleForm>
  </Create>
)