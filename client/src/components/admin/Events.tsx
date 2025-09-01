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
  SelectInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  ReferenceManyField,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ArrayField,
  SingleFieldList,
  ChipField
} from 'react-admin'

export const EventList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="type" />
      <NumberField source="chapterNumber" />
      <NumberField source="spoilerChapter" label="Spoiler Ch." />
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="name" />
      </ReferenceField>
      <ArrayField source="characters" label="Characters">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
      <TextField source="description" />
    </Datagrid>
  </List>
)

export const EventShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="description" />
      <TextField source="type" />
      <NumberField source="chapterNumber" />
      <NumberField source="spoilerChapter" />
      <ReferenceField source="arcId" reference="arcs" label="Arc">
        <TextField source="name" />
      </ReferenceField>
      <ArrayField source="characters" label="Characters">
        <SingleFieldList linkType={false}>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const EventEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={4} required />
      <SelectInput
        source="type"
        choices={[
          { id: 'arc', name: 'Arc' },
          { id: 'character_reveal', name: 'Character Reveal' },
          { id: 'plot_twist', name: 'Plot Twist' },
          { id: 'death', name: 'Death' },
          { id: 'backstory', name: 'Backstory' },
          { id: 'plot', name: 'Plot' },
          { id: 'other', name: 'Other' },
        ]}
        required
      />
      <NumberInput source="chapterNumber" required max={539} min={1} />
      <NumberInput source="spoilerChapter" max={539} min={1} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
)

export const EventCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="description" multiline rows={4} required />
      <SelectInput
        source="type"
        choices={[
          { id: 'arc', name: 'Arc' },
          { id: 'character_reveal', name: 'Character Reveal' },
          { id: 'plot_twist', name: 'Plot Twist' },
          { id: 'death', name: 'Death' },
          { id: 'backstory', name: 'Backstory' },
          { id: 'plot', name: 'Plot' },
          { id: 'other', name: 'Other' },
        ]}
        required
        defaultValue="other"
      />
      <NumberInput source="chapterNumber" required max={539} min={1} />
      <NumberInput source="spoilerChapter" max={539} min={1} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
)