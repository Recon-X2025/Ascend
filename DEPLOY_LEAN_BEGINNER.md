# Ascend — Step-by-Step Deployment Guide (Beginner-Friendly)

This guide walks you through deploying Ascend for about **$25–35/month**. No technical background needed—just follow each step in order.

---

## What You’ll Have at the End

- Your app live on the web (e.g. `ascend.vercel.app`)
- A small server (VPS) hosting your database, cache, and search
- A free file storage setup (Cloudflare R2)

---

## Prerequisites (Before You Start)

Check you have:

- [ ] **Vultr account** — [vultr.com](https://www.vultr.com) → Sign up if needed
- [ ] **Vercel account** — [vercel.com](https://vercel.com) → Sign up if needed (free Hobby plan)
- [ ] **GitHub account** — The Ascend code is at [github.com/Recon-X2025/Ascend](https://github.com/Recon-X2025/Ascend)
- [ ] **Your computer** — Mac or Windows with Terminal (Mac) or Command Prompt / PowerShell (Windows)

---

## Part 1: Create Your Server (Vultr)

### Step 1.1 — Log in to Vultr

1. Go to [my.vultr.com](https://my.vultr.com)
2. Sign in (or create an account)
3. Add a payment method if you haven’t (Products → Billing)

### Step 1.2 — Add a New Server

1. Click **“+”** or **“Deploy New Server”**
2. Choose **“Cloud Compute”**
3. Pick a location (e.g. **Singapore** or **New Jersey**)
4. Image: **Ubuntu 22.04**
5. Plan: **“Regular Performance”** → **4 GB RAM / 2 vCPU** (~$24/mo)
   - For testing, you can pick **2 GB** (~$12/mo)
6. Leave other options as default
7. Click **“Deploy Now”**

### Step 1.3 — Note Your Server IP

1. Wait 2–3 minutes until the server shows **“Running”**
2. Find the **IP Address** (e.g. `139.84.213.110`)
3. **Copy and save this IP** — you’ll need it many times

---

## Part 2: Set Up the Server (Install Database, Cache, Search)

You’ll run one command from your computer. It will connect to the server and install everything.

### Step 2.1 — Open Terminal on Your Mac

1. Press **Cmd + Space**, type **Terminal**, press Enter
2. A black or white window opens — that’s Terminal

### Step 2.2 — Go to Your Project Folder

Type this and press Enter (replace with your real path if different):

```bash
cd /Users/kathikiyer/Documents/Elevio
```

### Step 2.3 — Run the Setup Script

Type this (replace `YOUR_SERVER_IP` with the IP from Step 1.3):

```bash
./scripts/run-lean-setup-remote.sh YOUR_SERVER_IP
```

Example: if your IP is `139.84.213.110`:

```bash
./scripts/run-lean-setup-remote.sh 139.84.213.110
```

- It will ask for your server password (the one Vultr sent by email, or you set when creating the server)
- Type the password (nothing will appear as you type) and press Enter
- Wait 3–5 minutes while it installs Docker, Postgres, Redis, and Typesense

### Step 2.4 — If It Asks About “Authenticity of Host”

If you see: *“Are you sure you want to continue connecting?”*:

- Type **yes** and press Enter

### Step 2.5 — When It Finishes

You’ll see something like:

```
DATABASE_URL=postgresql://ascend:ascend123@139.84.213.110:5432/ascend
```

- **Copy this whole line** — you’ll add it to Vercel in Part 3

---

## Part 3: Run Database Setup (Migrations)

Migrations create the tables and initial data in your database.

### Step 3.1 — In Terminal (Same Window as Before)

Run these two commands (replace `YOUR_SERVER_IP` with your real IP):

```bash
DATABASE_URL="postgresql://ascend:ascend123@YOUR_SERVER_IP:5432/ascend" npx prisma migrate deploy
```

Press Enter, wait for it to finish, then run:

```bash
DATABASE_URL="postgresql://ascend:ascend123@YOUR_SERVER_IP:5432/ascend" npx prisma db seed
```

Press Enter and wait again.

---

## Part 4: Configure Vercel (Where Your App Lives)

### Step 4.1 — Log in to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in (with GitHub if your project is on GitHub)

### Step 4.2 — Open Your Project Settings

1. Click your **ascend** project (or the project name you use)
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)

### Step 4.3 — Add Each Variable

Click **“Add New”** for each row below. Use **“Production”** for Environment.

| Name | Value |
|-----|--------|
| `DATABASE_URL` | `postgresql://ascend:ascend123@YOUR_SERVER_IP:5432/ascend` |
| `REDIS_HOST` | `YOUR_SERVER_IP` |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | `ascend123` |
| `TYPESENSE_HOST` | `YOUR_SERVER_IP` |
| `TYPESENSE_PORT` | `8109` |
| `TYPESENSE_PROTOCOL` | `http` |
| `TYPESENSE_API_KEY` | `ascend_search_key` |
| `NEXTAUTH_URL` | `https://ascend.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://ascend.vercel.app` |
| `NEXTAUTH_SECRET` | *(see below)* |

**For `NEXTAUTH_SECRET`:** In Terminal, run:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

Replace `YOUR_SERVER_IP` everywhere with your real server IP (e.g. `139.84.213.110`).

### Step 4.4 — Save

Click **Save** after adding all variables.

---

## Part 5: Deploy Your App

### Step 5.1 — In Terminal

Make sure you’re in the project folder:

```bash
cd /Users/kathikiyer/Documents/Elevio
```

Then run:

```bash
vercel --prod
```

- If it asks to log in, follow the prompts
- Wait 2–5 minutes for the build to finish

### Step 5.2 — Get Your Live URL

When it finishes, it will show a URL like:

- `https://ascend-xxxxx.vercel.app`

or, if you’ve set a custom domain:

- `https://ascend.vercel.app`

Open that URL in your browser to see your live app.

---

## Part 6: Add File Storage (Optional but Recommended)

For things like resumes and session recordings, you need object storage. The free option is Cloudflare R2.

### Step 6.1 — Create Cloudflare Account and R2 Bucket

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign up or log in
3. In the left menu: **R2 Object Storage** → **Overview**
4. Click **Create bucket**
5. Name it: `ascend-prod`
6. Click **Create bucket**

### Step 6.2 — Create R2 API Token

1. Still in R2: **Manage R2 API Tokens**
2. **Create API token**
3. Token name: `ascend`
4. Permissions: **Object Read & Write**
5. Click **Create API token**
6. Copy **Access Key ID** and **Secret Access Key** (save them somewhere safe)

### Step 6.3 — Get Your Account ID

1. In Cloudflare, open any zone (or the Overview page)
2. In the right sidebar, find **Account ID**
3. Copy it

### Step 6.4 — Add R2 Variables to Vercel

In Vercel → ascend → **Settings** → **Environment Variables**, add:

| Name | Value |
|-----|--------|
| `STORAGE_PROVIDER` | `vultr` |
| `VULTR_STORAGE_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `VULTR_STORAGE_REGION` | `auto` |
| `VULTR_STORAGE_ACCESS_KEY` | *Your R2 Access Key ID* |
| `VULTR_STORAGE_SECRET_KEY` | *Your R2 Secret Access Key* |
| `VULTR_STORAGE_BUCKET` | `ascend-prod` |

Replace `ACCOUNT_ID` with your Cloudflare Account ID in the endpoint URL.

### Step 6.5 — Redeploy

In Terminal:

```bash
vercel --prod
```

This redeploys the app with the new storage settings.

---

## Part 7: Quick Checklist

Before you consider setup complete, check:

- [ ] Vultr server is running and you have its IP
- [ ] You ran `./scripts/run-lean-setup-remote.sh YOUR_SERVER_IP` successfully
- [ ] You ran both Prisma commands (migrate and seed)
- [ ] You added all required environment variables in Vercel
- [ ] You ran `vercel --prod` and saw a success message
- [ ] You can open your app URL in a browser
- [ ] (Optional) R2 bucket exists and you added the storage variables

---

## If Something Goes Wrong

### “Command not found” when running the script

- Make sure you’re in the project folder: `cd /Users/kathikiyer/Documents/Elevio`
- Check the script exists: `ls scripts/run-lean-setup-remote.sh`

### “Permission denied” when SSH-ing

- Verify the server IP
- Make sure you’re using the correct root password from Vultr

### “vercel: command not found”

- Install Vercel: `npm install -g vercel`
- Log in: `vercel login`

### App loads but shows errors (e.g. database error)

- Confirm every environment variable is set correctly in Vercel
- Make sure you redeployed after adding variables: `vercel --prod`

### Pages load slowly or fail

- Check that your Vultr server is still running
- Confirm ports 5432, 6379, and 8109 are open (the setup script should do this)

---

## Summary

| Step | What you did |
|------|--------------|
| 1 | Created a Vultr server and noted its IP |
| 2 | Ran `run-lean-setup-remote.sh` to install Postgres, Redis, Typesense |
| 3 | Ran Prisma migrate and seed |
| 4 | Added environment variables in Vercel |
| 5 | Deployed with `vercel --prod` |
| 6 | (Optional) Set up Cloudflare R2 for file storage |

Your app should now be live. Share the Vercel URL with users to access it.
