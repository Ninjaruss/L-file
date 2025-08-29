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
  SelectInput
} from 'react-admin'

export const GambleList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="difficulty" />
      <TextField source="outcome" />
      <ArrayField source="participants">
        <SingleFieldList>
          <ChipField source="name" size="small" />
        </SingleFieldList>
      </ArrayField>
    </Datagrid>
  </List>
)

export const GambleShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="rules" />
      <TextField source="difficulty" />
      <TextField source="outcome" />
      <ArrayField source="participants">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="winConditions">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
      <ArrayField source="loseConditions">
        <SingleFieldList>
          <ChipField source="name" />
        </SingleFieldList>
      </ArrayField>
    </SimpleShowLayout>
  </Show>
)

export const GambleEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="rules" multiline rows={6} />
      <SelectInput
        source="difficulty"
        choices={[
          { id: 'Easy', name: 'Easy' },
          { id: 'Medium', name: 'Medium' },
          { id: 'Hard', name: 'Hard' },
        ]}
      />
      <TextInput source="outcome" multiline rows={3} />
      <ArrayInput source="participants">
        <SimpleFormIterator>
          <TextInput source="" label="Participant" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="winConditions">
        <SimpleFormIterator>
          <TextInput source="" label="Win Condition" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="loseConditions">
        <SimpleFormIterator>
          <TextInput source="" label="Lose Condition" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Edit>
)

export const GambleCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline rows={4} />
      <TextInput source="rules" multiline rows={6} />
      <SelectInput
        source="difficulty"
        choices={[
          { id: 'Easy', name: 'Easy' },
          { id: 'Medium', name: 'Medium' },
          { id: 'Hard', name: 'Hard' },
        ]}
      />
      <TextInput source="outcome" multiline rows={3} />
      <ArrayInput source="participants">
        <SimpleFormIterator>
          <TextInput source="" label="Participant" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="winConditions">
        <SimpleFormIterator>
          <TextInput source="" label="Win Condition" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="loseConditions">
        <SimpleFormIterator>
          <TextInput source="" label="Lose Condition" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
)