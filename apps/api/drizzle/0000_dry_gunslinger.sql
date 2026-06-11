CREATE TYPE "public"."map_geometry_type" AS ENUM('polygon', 'line-string');--> statement-breakpoint
CREATE TYPE "public"."search_target_kind" AS ENUM('property', 'place', 'address');--> statement-breakpoint
CREATE TYPE "public"."search_target_source" AS ENUM('local', 'nominatim');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('case-worker', 'restricted-geodata', 'exporter');--> statement-breakpoint
CREATE TABLE "decision_layers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"render_order" integer NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"required_role" "user_role"
);
--> statement-breakpoint
CREATE TABLE "default_selected_layers" (
	"layer_id" text PRIMARY KEY NOT NULL,
	"render_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "map_feature_coordinates" (
	"feature_id" text NOT NULL,
	"position" integer NOT NULL,
	"lon" double precision NOT NULL,
	"lat" double precision NOT NULL,
	CONSTRAINT "map_feature_coordinates_feature_id_position_pk" PRIMARY KEY("feature_id","position")
);
--> statement-breakpoint
CREATE TABLE "map_features" (
	"id" text PRIMARY KEY NOT NULL,
	"layer_id" text NOT NULL,
	"geometry_type" "map_geometry_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"kind" "search_target_kind" NOT NULL,
	"lon" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"zoom" integer NOT NULL,
	"municipality" text,
	"source" "search_target_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"default_search_target_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "default_selected_layers" ADD CONSTRAINT "default_selected_layers_layer_id_decision_layers_id_fk" FOREIGN KEY ("layer_id") REFERENCES "public"."decision_layers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_feature_coordinates" ADD CONSTRAINT "map_feature_coordinates_feature_id_map_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."map_features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "map_features" ADD CONSTRAINT "map_features_layer_id_decision_layers_id_fk" FOREIGN KEY ("layer_id") REFERENCES "public"."decision_layers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_settings" ADD CONSTRAINT "workbench_settings_default_search_target_id_search_targets_id_fk" FOREIGN KEY ("default_search_target_id") REFERENCES "public"."search_targets"("id") ON DELETE no action ON UPDATE no action;