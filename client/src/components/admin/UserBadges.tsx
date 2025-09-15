'use client';

import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  DateField,
  NumberField,
  Create,
  SimpleForm,
  SelectInput,
  TextInput,
  DateTimeInput,
  NumberInput,
  ReferenceInput,
  AutocompleteInput,
  Show,
  SimpleShowLayout,
  ReferenceField,
  CreateButton,
  TopToolbar,
  useRecordContext,
  FunctionField,
  DeleteButton,
  EditButton,
  Filter,
  TextInputProps,
} from 'react-admin';

const UserBadgeActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

const UserBadgeFilter = (props: any) => (
  <Filter {...props}>
    <ReferenceInput source="userId" reference="users">
      <AutocompleteInput optionText="username" />
    </ReferenceInput>
    <ReferenceInput source="badgeId" reference="badges">
      <AutocompleteInput optionText="name" />
    </ReferenceInput>
    <BooleanField source="isActive" />
  </Filter>
);

// Custom field to show user badge with preview
const UserBadgePreview = () => {
  const record = useRecordContext();
  if (!record || !record.badge) return null;

  const getDisplayName = () => {
    if (record.badge.type === 'supporter' && record.year) {
      return `${record.badge.name} ${record.year}`;
    }
    return record.badge.name;
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide"
        style={{
          backgroundColor: record.badge.backgroundColor ? `${record.badge.backgroundColor}33` : 'transparent',
          borderColor: record.badge.color,
          color: record.badge.color
        }}
      >
        {getDisplayName()}
      </div>
    </div>
  );
};

export const UserBadgeList = () => (
  <List filters={<UserBadgeFilter />} actions={<UserBadgeActions />}>
    <Datagrid rowClick="show">
      <ReferenceField source="userId" reference="users" link="show">
        <TextField source="username" />
      </ReferenceField>
      <FunctionField
        label="Badge"
        render={(record: any) => {
          if (!record.badge) return null;
          const displayName = record.badge.type === 'supporter' && record.year
            ? `${record.badge.name} ${record.year}`
            : record.badge.name;
          return (
            <div className="flex items-center gap-2">
              <div
                className="inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: record.badge.backgroundColor ? `${record.badge.backgroundColor}33` : 'transparent',
                  borderColor: record.badge.color,
                  color: record.badge.color
                }}
              >
                {displayName}
              </div>
            </div>
          );
        }}
      />
      <DateField source="awardedAt" />
      <DateField source="expiresAt" />
      <BooleanField source="isActive" />
      <TextField source="reason" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const UserBadgeShow = () => (
  <Show>
    <SimpleShowLayout>
      <ReferenceField source="userId" reference="users">
        <TextField source="username" />
      </ReferenceField>
      <ReferenceField source="badgeId" reference="badges">
        <TextField source="name" />
      </ReferenceField>
      <FunctionField
        label="Badge Preview"
        render={(record: any) => {
          if (!record.badge) return null;
          return <UserBadgePreview />;
        }}
      />
      <DateField source="awardedAt" />
      <DateField source="expiresAt" />
      <NumberField source="year" />
      <TextField source="reason" />
      <BooleanField source="isActive" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </SimpleShowLayout>
  </Show>
);

export const UserBadgeCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="userId" reference="users" required>
        <AutocompleteInput optionText="username" />
      </ReferenceInput>
      <ReferenceInput source="badgeId" reference="badges" required>
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <TextInput source="reason" multiline rows={2} />
      <NumberInput source="year" helperText="Year for supporter badges" />
      <DateTimeInput source="expiresAt" helperText="Leave empty for permanent badges" />
    </SimpleForm>
  </Create>
);

// Award badge form component
export const AwardBadgeForm = () => (
  <Create resource="badges/award" redirect="list">
    <SimpleForm>
      <ReferenceInput source="userId" reference="users" required>
        <AutocompleteInput optionText="username" />
      </ReferenceInput>
      <ReferenceInput source="badgeId" reference="badges" required>
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <TextInput source="reason" multiline rows={2} />
    </SimpleForm>
  </Create>
);