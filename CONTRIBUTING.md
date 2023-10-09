# Welcome to the OpenVisit contribution guideline

Thank you for investing your time to contribute to OpenVisit!

In this guide you will get an overview of the contribution workflow from opening an issue, creating a PR, reviewing and merging the PR.

## New contributor guide

To get an overview of the project, read the root [README](README.md). Bellow, are some resources that will help you with open source contributions:

- [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [GitHub contribution flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)
- [pnpm CLI](https://pnpm.io/pnpm-cli);

## Contribution workflow

### Dependencies

This project uses `pnpm`, and should be run with Node.js on the latest available LTS version. Ensure you have the following dependencies setup:

- [Node.js](https://nodejs.org/en/) >= 18.17.0
- [pnpm](https://pnpm.io/installation) >= 8.6.0
- [Docker](https://www.docker.com/) >= 17.12.0

Refer to their respective documentation for installation instructions.

### Running locally

To clone the project locally:

- `git clone https://github.com/thtsystems/open-visit.git` for HTTP or `git clone git@github.com:thtsystems/open-visit.git` for SSH
- `cd cardinal`

This is the project's directory structure:

```bash
📦 <project root>
 ├ 📂 api ## Source code for API service running on Cloudflare Workers, written with Hono & Lucia.
 ├ 📂 database ## Configuration for the database connection and schema modeling using Drizzle.
 ├ 📂 web ## Web client application in React.
```

Some modules are shared with each other trough the [Workspace](https://pnpm.io/workspaces) feature from the `pnpm` package manager. For example, the `@open-visit/api` module imports the `@open-visit/database` module to connect to the database.

To install the dependencies, run `pnpm install` on the root directory. This will install the dependencies for all workspaces, including the ones under child directories.

#### Running the database container with Docker

First, make sure Docker is installed, and that the daemon service is running. You can check if the daemon is running by running `docker info` on the command line.

Run `docker compose up -d` to start the database container in the background (you can ommit the `-d` flag if you want to see the running logs for the Docker containers).

Once the container setup is finished those resources will be available:

- The database instance, running locally on `postgres://localhost:5432`
- A web based instance og [pgAdmin](https://www.pgadmin.org/) that can be used to visualize and interact visually with the database, running locally on `http://localhost:5050`

You can customize how you access both resources by creating new values on an `.env` file on the root directory. Unless explicitly specified, the default values will be used.

These are the default values:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
PGADMIN_PORT=5050
PGADMIN_DEFAULT_EMAIL=pgadmin4@pgadmin.org
PGADMIN_DEFAULT_PASSWORD=admin
```

Which means that, to access the database, you'll use the connection string `postgres://postgres:postgres@localhost:5432`, and to access the pgAdmin panel, you'll go to `http://localhost:5050` in the browser and use `pgadmin4@pgadmin.org` as the email and `admin` as the password during authentication.

#### Setting up the database

Before running the application, you should setup the database schema.

1. Run `docker compose up -d` from the root of the project to initialize the database container.
2. Run `pnpm env:create` to create local `.env` files with the default values on all workspaces.
3. List the docker containers with `docker ps`, look for the container id of the Postgres database container, and open it's terminal instance with `docker exec -it <container_id> bash`.
4. Run `psql -U postgres` to open the Postgres CLI.
5. On the `psql` console, create the database with `CREATE DATABASE openvisit;`. You can check if the database was created sucessfully with by going into it with `\c openvisit`.
6. On another terminal instance, in the root directory of the project, run `pnpm db:push` to push the schema definitions to the database.
7. Back on the `psql` terminal instance, you can check that the tables were created with `\d`, and `\d <table_name>` to check the columns of a specific table.

#### Running the services

With the database properly setup, all you need to do now is run the services. From the root of the project, you can run `pnpm dev`, and all the services will run concurrently using [Turbo](https://turbo.build/repo). Alternatively, you can run each service individually in seperate terminal instances by running `cd <workspace_directory>` and `pnpm dev` on each one.

### Pull Request

When you're finished with the changes, create a pull request.

- Fill the "Ready for review" template so that we can review your PR. This template helps reviewers understand your changes as well as the purpose of your pull request.
- Don't forget to [link PR to issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) if you are solving one.
- Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork) so the branch can be updated for a merge. Once you submit your PR, a team member will review your proposal. We may ask questions or request for additional information.
- We may ask for changes to be made before a PR can be merged, either using [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request) or pull request comments. You can apply suggested changes directly through the UI. You can make any other changes in your fork, then commit them to your branch.
- As you update your PR and apply changes, mark each conversation as [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- If you run into any merge issues, checkout this [git tutorial](https://lab.github.com/githubtraining/managing-merge-conflicts) to help you resolve merge conflicts and other issues.

It is possible that your pull request is denied if it does not align with our current development goals, but we'll try our best to make sure you receive feedback with detailed information as to why it has been rejected.

### Your PR is merged!

Congratulations :tada::tada: The community of OpenVisit maintainers and users thanks you for your contribution :sparkles:

## Credits

This CONTRIBUTING.md file was modelled after the [github/docs CONTRIBUTING.md](https://github.com/github/docs/blob/main/CONTRIBUTING.md) file, and we thank the original author.
