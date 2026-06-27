--
-- PostgreSQL database dump
--

\restrict oDj1xCc6g4CyyIizmSykrbD6oUEoSTiw9HueOXr6WQ16VG5sZaEtYluQej9Ai5p

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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
-- Name: enquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    property_id uuid NOT NULL,
    agent_id uuid,
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    reply text
);


ALTER TABLE public.enquiries OWNER TO postgres;

--
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    agent_id uuid,
    preferred_date date NOT NULL,
    preferred_time character varying(20) NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payment_phone character varying(20),
    payment_provider character varying(20),
    amount integer DEFAULT 2000,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(150) NOT NULL,
    first_name character varying(100),
    is_active boolean DEFAULT true,
    token text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.newsletter_subscribers OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid,
    type character varying(20) NOT NULL,
    amount integer NOT NULL,
    plan character varying(20),
    days integer,
    phone_number character varying(20),
    provider character varying(20),
    status character varying(20) DEFAULT 'pending'::character varying,
    provider_reference character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO postgres;

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
    deleted_at timestamp without time zone,
    currency character varying(10) DEFAULT 'USD'::character varying,
    mortgage_available boolean DEFAULT false,
    mortgage_rate numeric(5,2),
    mortgage_term integer,
    is_featured boolean DEFAULT false,
    featured_until timestamp without time zone,
    latitude numeric(10,7),
    longitude numeric(10,7),
    country character varying(100) DEFAULT 'Uganda'::character varying,
    district character varying(100)
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
-- Name: saved_properties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_properties (
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    saved_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.saved_properties OWNER TO postgres;

--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_categories (
    id smallint NOT NULL,
    tier character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL
);


ALTER TABLE public.service_categories OWNER TO postgres;

--
-- Name: service_provider_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_provider_categories (
    provider_id uuid NOT NULL,
    category_id smallint NOT NULL
);


ALTER TABLE public.service_provider_categories OWNER TO postgres;

--
-- Name: service_provider_enquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_provider_enquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    sender_name character varying(150) NOT NULL,
    sender_email character varying(150) NOT NULL,
    sender_phone character varying(30),
    message text NOT NULL,
    status character varying(20) DEFAULT 'unread'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.service_provider_enquiries OWNER TO postgres;

--
-- Name: service_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name character varying(150) NOT NULL,
    description text NOT NULL,
    phone_number character varying(30) NOT NULL,
    email character varying(150),
    whatsapp character varying(30),
    country character varying(100) DEFAULT 'Uganda'::character varying,
    district character varying(100),
    location character varying(150),
    years_experience smallint,
    logo_url text,
    images text[],
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_verified boolean DEFAULT false,
    rating numeric(2,1),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    tier character varying(20) DEFAULT 'free'::character varying,
    subscription_expires_at timestamp with time zone
);


ALTER TABLE public.service_providers OWNER TO postgres;

--
-- Name: short_stay_blocked_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.short_stay_blocked_dates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    blocked_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.short_stay_blocked_dates OWNER TO postgres;

--
-- Name: short_stay_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.short_stay_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    guest_id uuid NOT NULL,
    host_id uuid NOT NULL,
    check_in date NOT NULL,
    check_out date NOT NULL,
    guests integer DEFAULT 1 NOT NULL,
    total_amount numeric(14,2) DEFAULT 0 NOT NULL,
    phone_number character varying(30) NOT NULL,
    provider character varying(20) DEFAULT 'mtn'::character varying NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_dates CHECK ((check_out > check_in)),
    CONSTRAINT chk_guests CHECK ((guests >= 1))
);


ALTER TABLE public.short_stay_bookings OWNER TO postgres;

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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verification_token text,
    verification_token_expires timestamp without time zone,
    reset_token text,
    reset_token_expires timestamp without time zone,
    is_agent_verified boolean DEFAULT false,
    listing_count integer DEFAULT 0,
    is_premium boolean DEFAULT false,
    premium_expires_at timestamp without time zone
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
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: inspections inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


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
-- Name: saved_properties saved_properties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_properties
    ADD CONSTRAINT saved_properties_pkey PRIMARY KEY (user_id, property_id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_slug_key UNIQUE (slug);


--
-- Name: service_provider_categories service_provider_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provider_categories
    ADD CONSTRAINT service_provider_categories_pkey PRIMARY KEY (provider_id, category_id);


--
-- Name: service_provider_enquiries service_provider_enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provider_enquiries
    ADD CONSTRAINT service_provider_enquiries_pkey PRIMARY KEY (id);


--
-- Name: service_providers service_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_providers
    ADD CONSTRAINT service_providers_pkey PRIMARY KEY (id);


--
-- Name: short_stay_blocked_dates short_stay_blocked_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_blocked_dates
    ADD CONSTRAINT short_stay_blocked_dates_pkey PRIMARY KEY (id);


--
-- Name: short_stay_blocked_dates short_stay_blocked_dates_property_id_blocked_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_blocked_dates
    ADD CONSTRAINT short_stay_blocked_dates_property_id_blocked_date_key UNIQUE (property_id, blocked_date);


--
-- Name: short_stay_bookings short_stay_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_bookings
    ADD CONSTRAINT short_stay_bookings_pkey PRIMARY KEY (id);


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
-- Name: idx_blocked_dates_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocked_dates_property ON public.short_stay_blocked_dates USING btree (property_id, blocked_date);


--
-- Name: idx_newsletter_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_newsletter_active ON public.newsletter_subscribers USING btree (is_active);


--
-- Name: idx_properties_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_city ON public.properties_old USING btree (city);


--
-- Name: idx_properties_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_country ON public.properties USING btree (country);


--
-- Name: idx_properties_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_properties_district ON public.properties USING btree (district);


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
-- Name: idx_service_providers_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_providers_district ON public.service_providers USING btree (district);


--
-- Name: idx_service_providers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_providers_status ON public.service_providers USING btree (status);


--
-- Name: idx_service_providers_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_providers_user ON public.service_providers USING btree (user_id);


--
-- Name: idx_sp_enquiries_provider; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sp_enquiries_provider ON public.service_provider_enquiries USING btree (provider_id);


--
-- Name: idx_spc_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_spc_category ON public.service_provider_categories USING btree (category_id);


--
-- Name: idx_ss_bookings_guest; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ss_bookings_guest ON public.short_stay_bookings USING btree (guest_id);


--
-- Name: idx_ss_bookings_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ss_bookings_host ON public.short_stay_bookings USING btree (host_id);


--
-- Name: idx_ss_bookings_property; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ss_bookings_property ON public.short_stay_bookings USING btree (property_id);


--
-- Name: agent_profiles agent_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agent_profiles
    ADD CONSTRAINT agent_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: enquiries enquiries_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: enquiries enquiries_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: enquiries enquiries_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inspections inspections_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: inspections inspections_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: payments payments_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: saved_properties saved_properties_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_properties
    ADD CONSTRAINT saved_properties_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: saved_properties saved_properties_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_properties
    ADD CONSTRAINT saved_properties_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_provider_categories service_provider_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provider_categories
    ADD CONSTRAINT service_provider_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- Name: service_provider_categories service_provider_categories_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provider_categories
    ADD CONSTRAINT service_provider_categories_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;


--
-- Name: service_provider_enquiries service_provider_enquiries_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_provider_enquiries
    ADD CONSTRAINT service_provider_enquiries_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id) ON DELETE CASCADE;


--
-- Name: service_providers service_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_providers
    ADD CONSTRAINT service_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: short_stay_blocked_dates short_stay_blocked_dates_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_blocked_dates
    ADD CONSTRAINT short_stay_blocked_dates_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: short_stay_bookings short_stay_bookings_guest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_bookings
    ADD CONSTRAINT short_stay_bookings_guest_id_fkey FOREIGN KEY (guest_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: short_stay_bookings short_stay_bookings_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_bookings
    ADD CONSTRAINT short_stay_bookings_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: short_stay_bookings short_stay_bookings_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.short_stay_bookings
    ADD CONSTRAINT short_stay_bookings_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: users users_role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict oDj1xCc6g4CyyIizmSykrbD6oUEoSTiw9HueOXr6WQ16VG5sZaEtYluQej9Ai5p

