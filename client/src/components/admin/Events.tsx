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
  SelectInput
} from 'react-admin'

export const EventList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="eventType" />
      <NumberField source="chapter" />
      <TextField source="significance" />
    </Datagrid>
  </List>
)

export const EventShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="eventType" />
      <NumberField source="chapter" />
      <TextField source="significance" />
      <TextField source="outcome" />
    </SimpleShowLayout>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <SelectInput
        source="eventType"
        choices={[
          { id: 'Gamble', name: 'Gamble' },
          { id: 'Character Introduction', name: 'Character Introduction' },
          { id: 'Plot Development', name: 'Plot Development' },
          { id: 'Revelation', name: 'Revelation' },
        ]}
      />
      <NumberInput source="chapter" />
      <SelectInput
        source="significance"
        choices={[
          { id: 'Major', name: 'Major' },
          { id: 'Moderate', name: 'Moderate' },
          { id: 'Minor', name: 'Minor' },
        ]}
      />
      <TextInput source="outcome" multiline rows={3} />
    </SimpleForm>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <SelectInput
        source="eventType"
        choices={[
          { id: 'Gamble', name: 'Gamble' },
          { id: 'Character Introduction', name: 'Character Introduction' },
          { id: 'Plot Development', name: 'Plot Development' },
          { id: 'Revelation', name: 'Revelation' },
        ]}
      />
      <NumberInput source="chapter" />
      <SelectInput
        source="significance"
        choices={[
          { id: 'Major', name: 'Major' },
          { id: 'Moderate', name: 'Moderate' },
          { id: 'Minor', name: 'Minor' },
        ]}
      />
      <TextInput source="outcome" multiline rows={3} />
    </SimpleForm>
  </Create>
)