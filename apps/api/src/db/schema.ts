import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['case-worker', 'restricted-geodata', 'exporter']);

export const searchTargetKindEnum = pgEnum('search_target_kind', ['property', 'place', 'address']);

export const searchTargetSourceEnum = pgEnum('search_target_source', ['local', 'nominatim']);

export const mapGeometryTypeEnum = pgEnum('map_geometry_type', ['polygon', 'line-string']);

export const decisionLayers = pgTable('decision_layers', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  renderOrder: integer('render_order').notNull(),
  restricted: boolean('restricted').notNull().default(false),
  requiredRole: userRoleEnum('required_role'),
});

export const searchTargets = pgTable('search_targets', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  kind: searchTargetKindEnum('kind').notNull(),
  lon: doublePrecision('lon').notNull(),
  lat: doublePrecision('lat').notNull(),
  zoom: integer('zoom').notNull(),
  municipality: text('municipality'),
  source: searchTargetSourceEnum('source').notNull(),
});

export const mapFeatures = pgTable('map_features', {
  id: text('id').primaryKey(),
  layerId: text('layer_id')
    .notNull()
    .references(() => decisionLayers.id, { onDelete: 'cascade' }),
  geometryType: mapGeometryTypeEnum('geometry_type').notNull(),
});

export const mapFeatureCoordinates = pgTable(
  'map_feature_coordinates',
  {
    featureId: text('feature_id')
      .notNull()
      .references(() => mapFeatures.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    lon: doublePrecision('lon').notNull(),
    lat: doublePrecision('lat').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.featureId, table.position],
    }),
  ],
);

export const workbenchSettings = pgTable('workbench_settings', {
  id: text('id').primaryKey(),
  defaultSearchTargetId: text('default_search_target_id')
    .notNull()
    .references(() => searchTargets.id),
});

export const defaultSelectedLayers = pgTable('default_selected_layers', {
  layerId: text('layer_id')
    .primaryKey()
    .references(() => decisionLayers.id, { onDelete: 'cascade' }),
  renderOrder: integer('render_order').notNull(),
});
