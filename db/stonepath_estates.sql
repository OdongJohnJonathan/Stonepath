--
-- PostgreSQL database dump
--

\restrict 61qdlFPccY1HghmYN0ZoBa31vlEhrTPVqztmtBDQcztQTlCW82eYkWqRKxTiFOv

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agent_profiles (
    user_id uuid NOT NULL,
    license_number character varying(100) NOT NULL,
    agency_name character varying(255),
    bio text,
    years_of_experience smallint,
    social_website character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT agent_profiles_years_of_experience_check CHECK ((years_of_experience >= 0))
);


ALTER TABLE public.agent_profiles OWNER TO postgres;

--
-- Name: amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.amenities (
    id smallint NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.amenities OWNER TO postgres;

--
-- Name: properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    location character varying(255) NOT NULL,
    address character varying(255),
    bedrooms smallint,
    bathrooms smallint,
    square_footage integer,
    parking_details character varying(255),
    amenities jsonb,
    year_built smallint,
    neighbourhood_insights text,
    status character varying(50) DEFAULT 'pending'::character varying,
    property_type_id smallint,
    transaction_type_id smallint,
    created_by uuid,
    images text[],
    videos text[],
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.properties OWNER TO postgres;

--
-- Name: properties_old; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.properties_old (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    property_type_id smallint NOT NULL,
    transaction_type_id smallint NOT NULL,
    price numeric(15,2) NOT NULL,
    bedrooms smallint,
    bathrooms smallint,
    area_sqm numeric(10,2),
    country character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    address text,
    is_published boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT properties_area_sqm_check CHECK ((area_sqm >= (0)::numeric)),
    CONSTRAINT properties_bathrooms_check CHECK ((bathrooms >= 0)),
    CONSTRAINT properties_bedrooms_check CHECK ((bedrooms >= 0)),
    CONSTRAINT properties_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.properties_old OWNER TO postgres;

--
-- Name: property_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_amenities (
    property_id uuid NOT NULL,
    amenity_id smallint NOT NULL
);


ALTER TABLE public.property_amenities OWNER TO postgres;

--
-- Name: property_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_media (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    property_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type character varying(20) NOT NULL,
    display_order smallint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT property_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['IMAGE'::character varying, 'VIDEO'::character varying])::text[])))
);


ALTER TABLE public.property_media OWNER TO postgres;

--
-- Name: property_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.property_types (
    id smallint NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50)
);


ALTER TABLE public.property_types OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id smallint NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: transaction_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_types (
    id smallint NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50)
);


ALTER TABLE public.transaction_types OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(20),
    password_hash character varying(255) NOT NULL,
    role smallint NOT NULL,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_login_at timestamp without time zone,
    failed_login_attempts smallint DEFAULT 0,
    account_locked_until timestamp without time zone,
    profile_image_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: agent_profiles agent_profiles_license_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_profiles
    ADD CONSTRAINT agent_profiles_license_number_key UNIQUE (license_number);


--
-- Name: agent_profiles agent_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_profiles
    ADD CONSTRAINT agent_profiles_pkey PRIMARY KEY (user_id);


--
-- Name: amenities amenities_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_name_key UNIQUE (name);


--
-- Name: amenities amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.amenities
    ADD CONSTRAINT amenities_pkey PRIMARY KEY (id);


--
-- Name: properties_old properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties_old
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey1 PRIMARY KEY (id);


--
-- Name: property_amenities property_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_pkey PRIMARY KEY (property_id, amenity_id);


--
-- Name: property_media property_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_pkey PRIMARY KEY (id);


--
-- Name: property_types property_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_name_key UNIQUE (name);


--
-- Name: property_types property_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_pkey PRIMARY KEY (id);


--
-- Name: property_types property_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_types
    ADD CONSTRAINT property_types_slug_key UNIQUE (slug);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: transaction_types transaction_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_types
    ADD CONSTRAINT transaction_types_name_key UNIQUE (name);


--
-- Name: transaction_types transaction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_types
    ADD CONSTRAINT transaction_types_pkey PRIMARY KEY (id);


--
-- Name: transaction_types transaction_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_types
    ADD CONSTRAINT transaction_types_slug_key UNIQUE (slug);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_properties_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_city ON public.properties_old USING btree (city);


--
-- Name: idx_properties_owner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_owner_id ON public.properties_old USING btree (owner_id);


--
-- Name: idx_properties_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_price ON public.properties_old USING btree (price);


--
-- Name: idx_properties_property_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_property_type ON public.properties_old USING btree (property_type_id);


--
-- Name: idx_properties_transaction_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_transaction_type ON public.properties_old USING btree (transaction_type_id);


--
-- Name: idx_properties_visibility; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_visibility ON public.properties_old USING btree (is_published, is_approved);


--
-- Name: idx_property_amenities_amenity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_amenities_amenity ON public.property_amenities USING btree (amenity_id);


--
-- Name: idx_property_amenities_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_amenities_property ON public.property_amenities USING btree (property_id);


--
-- Name: idx_property_media_property_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_property_media_property_id ON public.property_media USING btree (property_id);


--
-- Name: agent_profiles agent_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_profiles
    ADD CONSTRAINT agent_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: properties properties_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: properties_old properties_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties_old
    ADD CONSTRAINT properties_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: properties_old properties_property_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties_old
    ADD CONSTRAINT properties_property_type_id_fkey FOREIGN KEY (property_type_id) REFERENCES public.property_types(id);


--
-- Name: properties properties_property_type_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_property_type_id_fkey1 FOREIGN KEY (property_type_id) REFERENCES public.property_types(id);


--
-- Name: properties_old properties_transaction_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties_old
    ADD CONSTRAINT properties_transaction_type_id_fkey FOREIGN KEY (transaction_type_id) REFERENCES public.transaction_types(id);


--
-- Name: properties properties_transaction_type_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_transaction_type_id_fkey1 FOREIGN KEY (transaction_type_id) REFERENCES public.transaction_types(id);


--
-- Name: property_amenities property_amenities_amenity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_amenity_id_fkey FOREIGN KEY (amenity_id) REFERENCES public.amenities(id) ON DELETE CASCADE;


--
-- Name: property_amenities property_amenities_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties_old(id) ON DELETE CASCADE;


--
-- Name: property_media property_media_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.property_media
    ADD CONSTRAINT property_media_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties_old(id) ON DELETE CASCADE;


--
-- Name: users users_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 61qdlFPccY1HghmYN0ZoBa31vlEhrTPVqztmtBDQcztQTlCW82eYkWqRKxTiFOv

