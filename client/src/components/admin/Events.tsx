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
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ArrayField,
  SingleFieldList,
  ChipField,
  FilterButton,
  TopToolbar,
  CreateButton,
  ExportButton,
  SearchInput
} from 'react-admin'

const EventFilters = [
  <SearchInput key="title-search" source="title" placeholder="Search by title" alwaysOn />,
  <SelectInput
    key="type-filter"
    source="type"
    label="Type"
    choices={[
      { id: 'gamble', name: 'Gamble' },
      { id: 'decision', name: 'Decision' },
      { id: 'reveal', name: 'Reveal' },
      { id: 'shift', name: 'Shift' },
      { id: 'resolution', name: 'Resolution' },
    ]}
  />,
  <SelectInput
    key="status-filter"
    source="status"
    label="Status"
    choices={[
      { id: 'draft', name: 'Draft' },
      { id: 'pending_review', name: 'Pending Review' },
      { id: 'approved', name: 'Approved' },
    ]}
  />,
  <ReferenceInput key="arc-filter" source="arcId" reference="arcs" label="Arc">
    <AutocompleteInput optionText="name" />
  </ReferenceInput>,
]

const EventListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const EventList = () => (
  <List filters={EventFilters} actions={<EventListActions />}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="type" />
      <NumberField source="chapterNumber" />
      <NumberField source="spoilerChapter" label="Spoiler Ch." />
      <TextField source="status" />
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
      <TextField source="status" />
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
          { id: 'gamble', name: 'Gamble' },
          { id: 'decision', name: 'Decision' },
          { id: 'reveal', name: 'Reveal' },
          { id: 'shift', name: 'Shift' },
          { id: 'resolution', name: 'Resolution' },
        ]}
        required
      />
      <NumberInput source="chapterNumber" required max={539} min={1} />
      <NumberInput source="spoilerChapter" max={539} min={1} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <SelectInput
        source="status"
        choices={[
          { id: 'draft', name: 'Draft' },
          { id: 'pending_review', name: 'Pending Review' },
          { id: 'approved', name: 'Approved' },
        ]}
        required
        defaultValue="draft"
      />
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
          { id: 'gamble', name: 'Gamble' },
          { id: 'decision', name: 'Decision' },
          { id: 'reveal', name: 'Reveal' },
          { id: 'shift', name: 'Shift' },
          { id: 'resolution', name: 'Resolution' },
        ]}
        required
        defaultValue="decision"
      />
      <NumberInput source="chapterNumber" required max={539} min={1} />
      <NumberInput source="spoilerChapter" max={539} min={1} />
      <ReferenceInput source="arcId" reference="arcs" label="Arc">
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <SelectInput
        source="status"
        choices={[
          { id: 'draft', name: 'Draft' },
          { id: 'pending_review', name: 'Pending Review' },
          { id: 'approved', name: 'Approved' },
        ]}
        required
        defaultValue="draft"
      />
      <ReferenceArrayInput source="characterIds" reference="characters" label="Characters">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
)