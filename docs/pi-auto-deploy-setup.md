# Pi Auto-Deploy Setup

This guide sets up automatic deployment to your Raspberry Pi when code is pushed to GitHub.

## How It Works

1. You push code to GitHub (from laptop/desktop)
2. GitHub Actions triggers a workflow
3. Self-hosted runner on Pi receives the job
4. Pi pulls code and restarts containers

**No ports to open. No security exposure. Free.**

---

## Setup Steps (One-Time on Pi)

### 1. SSH into your Pi

```bash
ssh pi@your-pi-ip
```

### 2. Create a directory for the runner

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
```

### 3. Download the runner

Go to: https://github.com/bigtuff8/family-hub/settings/actions/runners/new

Select **Linux** and **ARM64** (for Pi 4/5)

Copy the download commands shown, they'll look like:

```bash
curl -o actions-runner-linux-arm64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-arm64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-arm64-2.311.0.tar.gz
```

### 4. Configure the runner

Run the config command from the GitHub page (includes your token):

```bash
./config.sh --url https://github.com/bigtuff8/family-hub --token YOUR_TOKEN_HERE
```

When prompted:
- **Runner name:** `family-hub-pi` (or whatever you want)
- **Labels:** press Enter for default
- **Work folder:** press Enter for default

### 5. Install as a service (runs on boot)

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

### 6. Verify it's running

```bash
sudo ./svc.sh status
```

You should also see the runner appear as "Online" at:
https://github.com/bigtuff8/family-hub/settings/actions/runners

---

## Testing the Deploy

1. Make any small change on your laptop
2. Commit and push to main
3. Go to https://github.com/bigtuff8/family-hub/actions
4. Watch the "Deploy to Pi" workflow run
5. Pi should pull and restart automatically

---

## Manual Deploy

If you need to trigger a deploy manually:

1. Go to https://github.com/bigtuff8/family-hub/actions
2. Click "Deploy to Pi" workflow
3. Click "Run workflow" button

---

## Troubleshooting

### Runner offline?

```bash
cd ~/actions-runner
sudo ./svc.sh status
sudo ./svc.sh restart
```

### Check runner logs

```bash
cd ~/actions-runner
cat _diag/Runner_*.log | tail -50
```

### Workflow failing?

Check the Actions tab on GitHub for error details.

---

## Useful Commands

```bash
# Stop the runner service
sudo ./svc.sh stop

# Uninstall the runner service
sudo ./svc.sh uninstall

# Reconfigure runner (if needed)
./config.sh remove
./config.sh --url https://github.com/bigtuff8/family-hub --token NEW_TOKEN
```

---

**Setup time:** ~10 minutes
**Last updated:** December 2025
