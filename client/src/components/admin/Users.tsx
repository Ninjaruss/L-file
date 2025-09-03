import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Edit,
  Show,
  SimpleForm,
  TextInput,
  SimpleShowLayout,
  BooleanField,
  BooleanInput,
  SelectInput
} from 'react-admin'

export const UserList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isEmailVerified" />
      <DateField source="createdAt" />
    </Datagrid>
  </List>
)

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="role" />
      <BooleanField source="isEmailVerified" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
)

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="username" required />
      <TextInput source="email" type="email" required />
      <SelectInput
        source="role"
        choices={[
          { id: 'user', name: 'User' },
          { id: 'moderator', name: 'Moderator' },
          { id: 'admin', name: 'Admin' },
        ]}
      />
      <BooleanInput source="isEmailVerified" />
    </SimpleForm>
  </Edit>
)