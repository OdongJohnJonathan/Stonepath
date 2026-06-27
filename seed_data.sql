--
-- PostgreSQL database dump
--

\restrict MgrI1Jqx7M4d4T0ScRyL2acaOFelQk2A2zMqHDb7fLBX9poKJQo9xfAjvVtTAqs

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
-- Data for Name: property_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.property_types (id, name, slug) FROM stdin;
1	Apartment	apartment
2	House	house
3	Studio	studio
4	Penthouse	penthouse
5	Commercial	commercial
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	USER
2	AGENT
3	MODERATOR
4	SUPER_ADMIN
5	SERVICE_PROVIDER
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_categories (id, tier, name, slug) FROM stdin;
1	Legal & Financial	Land Title Surveyors	land-title-surveyors
2	Legal & Financial	Real Estate Attorneys	real-estate-attorneys
3	Legal & Financial	Valuation Experts	valuation-experts
4	Legal & Financial	Mortgage/Loan Brokers	mortgage-loan-brokers
5	Legal & Financial	Home Insurance Brokers	home-insurance-brokers
6	Home Maintenance & Trades	Solar/Inverter Technicians	solar-inverter-technicians
7	Home Maintenance & Trades	Water Pump/Borehole Specialists	borehole-specialists
8	Home Maintenance & Trades	CCTV & Intercom Installers	cctv-intercom-installers
9	Home Maintenance & Trades	Generator Maintenance	generator-maintenance
10	Home Maintenance & Trades	General Plumbers	general-plumbers
11	Home Maintenance & Trades	General Electricians	general-electricians
12	Home Maintenance & Trades	Waste/Junk Removal	waste-junk-removal
13	Home Maintenance & Trades	Fumigation/Pest Control	fumigation-pest-control
14	Home Maintenance & Trades	Professional Deep Cleaners	deep-cleaners
15	Home Maintenance & Trades	Movers & Transport	movers-transport
16	Design & Renovation	Cabinetry & Joinery	cabinetry-joinery
17	Design & Renovation	Curtain & Blind Installers	curtain-blind-installers
18	Design & Renovation	Landscaping & Hardscape Designers	landscaping-designers
19	Design & Renovation	Professional Home Stagers	home-stagers
20	Design & Renovation	Smart Home Integrators	smart-home-integrators
\.


--
-- Data for Name: transaction_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_types (id, name, slug) FROM stdin;
1	Sale	sale
2	Rent	rent
3	Lease	lease
\.


--
-- PostgreSQL database dump complete
--

\unrestrict MgrI1Jqx7M4d4T0ScRyL2acaOFelQk2A2zMqHDb7fLBX9poKJQo9xfAjvVtTAqs

