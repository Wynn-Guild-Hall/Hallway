---
title: "What"
description: "What is the Guild Hall and how does it work?"
icon: "circle-info"
back: "about"
# This page lived at /what/ before the four moved under /about/. Hugo emits a
# redirect stub at the old path so links already shared keep working.
aliases: ["/what/"]
---

> The **Guild Hall** is a shared service designed to automatically compile representation from all presently major Wynncraft guilds.

To accomplish this, it generates [four seats](/about/what/#available-seats) for each guild determined [based on various criteria](/about/who/#what-guilds-are-represented) to be presently notable.

Representatives can, following a quick [verification](/about/how/#claiming-your-seat) of chiefhood in such a guild, claim one of their guild's [four seats](/about/what/#available-seats).

-# Representatives are removed if another chief from their guild joins in the seat they represent (replacement), once the guild they represent fails all notability [tests]() (relegation), or if a majority of the hall votes to remove their guild (suspension).

## Available Seats
> Each [major](/about/who/#what-guilds-are-represented) guild can claim up to four seats:
### An Ownership Contact
This seat is intended for the person who represnts the guild, in general.

-# Usually the guild's owner, this person is intended to be whomever has the broadest claim to direction interest of their guild.

-# In addition to providing major guild owners with a venue to discuss with others to share and discuss with others 'ways of doing things', 'best practices', etc., this seat also gives access to a few shared services (notably including primary access to determine information on shared projects (such as Recruitment List project), limited hosting services, etc.).

### An Events Contact
This seat is intended for the person who most frequently coordinates the guild's event and activity efforts.

-# Efforts to plan joint events, share event resources, etc. will therefore usuially run through this person.

### A Housing Contact
This seat is intended for the person most actively involved on planning, coordinating, and ideating the guild's housing project(s).

-# In addition to ideation and resource sharing, this person will be responsible for coordinating access to some of the Hall's shared housing services.

### A Warring Contat
This seat is *intended* for a preson responsible to speak to the guild's on-map actions, but is admittedly aspirational.

-# Frequently, conflicts can arise with respect to guilds territory holdings/behaviours; ideally, there would be a clean way to resolve them.
-# A few people requested having a responsible to speak to regarding other on-map guilds behaviours, and this seat is that responsible.
-# Whether or not this actually *helps* with anything is an unresolved question. The seat exists for now regardless.

## Services?
#### Since we have a bunch of people compiled together in one place, the Hall is in a unique position to pool and route select resources and informations.
> The following projects are either planned, in development, or have launched:

### A Recruitment List
A chief-editable public-facing list of recruiting guilds, their reqs, contacts, etc.

-# Historically, SG_Voltage maintained a pinned list on the forums of all guilds currently recruiting, their requirements, contact infos, etc.
As you can imagine, that list proved to be a pain to maintain and was eventually abandoned.

-# A successor to that project would be a chief-editable list of all guilds, their contact informations, their recruitment criteria, etc.
The tech for such a system was already developed in the creation of a hall, so such a system should be comparatively cheap and easy to make.

### A Housing Server
Wynn housing, recreated 1:1, hosting island copies with tooled creative mode.

-# Unlike bots, websites, and the like which are comparatively cheap to host and maintain (small VPS suffice for most purposes and are very versitile!), housing servers are another problem.
Even with just one person on a world 50% of the time, considering hosting and licenses, a single housing server can be more expensive than a guild's entire infrastructure stack.

-# Several guilds already have similar servers and have agreed to pool their resources; the hall will host a build server open to all major guilds.
This server will have copies of everyone's islands, full build tools with paid-tier (axiom, gosuite, etc) and other licenses (voxelsniper, worldpainter, worldedit, etc), and import/export capabilities.
Most notably, it will be a 1:1 recreation of wynncraft housing, with the exact palette and placement limitations, absence of gravity, etc. Exports will also calculate profession material costs.

### Shared Hosting.
Access to subdomains, routing, cdn, and basic vps hosting for your guild.

-# Domains are another expense and not all guilds have one. Hosting and CDNs can also be a similar expense.
This project is currently hosted on dns/vpss loaned by the VETS guild, but we intend to move to dedicated services in the near future.

-# Once this happens, we will, on request, give all major guilds their own subinfra including a subdomain of some generic wynn guild domain we will get.
This will probably also include a link shortener, image host, and access to both.

## Wynnvets?
> The Hall is not a vets project!

This place currently lives on infrastructure/domains donated by the Vets guild.
At some point in the future, we plan to move off to purpose-procured systems.