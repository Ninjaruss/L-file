import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  ArrayField,
  ChipField,
  SingleFieldList,
  Edit,
  Create,
  Show,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  SimpleShowLayout,
  NumberInput,
  NumberField,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ReferenceArrayField
} from 'react-admin'

export const CharacterList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" label="First Chapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList linkType={false}>
          <ChipField source="" size="small" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="factions" label="Factions">
        <SingleFieldList linkType={false}>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
    </Datagrid>
  </List>
)

export const CharacterShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="occupation" />
      <NumberField source="firstAppearanceChapter" />
      <ArrayField source="alternateNames">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableRoles">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="notableGames">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="affiliations">
        <SingleFieldList linkType={false}>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="factions" label="Factions">
        <SingleFieldList linkType={false}>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const CharacterEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="occupation" />
      <NumberInput source="firstAppearanceChapter" max={539} min={1} />
      <ArrayInput source="alternateNames">
        <SimpleFormIterator>
          <TextInput source="" label="Alternate Name" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableRoles">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Role" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableGames">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Game" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="affiliations">
        <SimpleFormIterator>
          <TextInput source="" label="Affiliation" />
        </SimpleFormIterator>
      </ArrayInput>
      <ReferenceArrayInput source="factions" reference="factions" label="Factions">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
)

export const CharacterCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="occupation" />
      <NumberInput source="firstAppearanceChapter" max={539} min={1} />
      <ArrayInput source="alternateNames">
        <SimpleFormIterator>
          <TextInput source="" label="Alternate Name" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableRoles">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Role" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="notableGames">
        <SimpleFormIterator>
          <TextInput source="" label="Notable Game" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="affiliations">
        <SimpleFormIterator>
          <TextInput source="" label="Affiliation" />
        </SimpleFormIterator>
      </ArrayInput>
      <ReferenceArrayInput source="factions" reference="factions" label="Factions">
        <AutocompleteArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
)