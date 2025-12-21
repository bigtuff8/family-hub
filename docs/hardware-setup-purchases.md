# Family Hub - Hardware Setup & Purchases

## Overview

This document captures the hardware research, decisions, and purchases for the Family Hub DIY Raspberry Pi project.

**Total Hardware Cost:** £170.01
**Purchase Date:** October 2025
**Status:** All items purchased and operational

-----

## Hardware Purchased

### 1. Display: Acer T232HL

|Specification       |Details                                  |
|--------------------|-----------------------------------------|
|**Model**           |Acer T232HL                              |
|**Size**            |23" (viewable)                           |
|**Resolution**      |1920×1080 (Full HD)                      |
|**Panel Type**      |IPS (excellent viewing angles)           |
|**Touch Technology**|PCAP (Projected Capacitive)              |
|**Touch Points**    |10-point multi-touch                     |
|**Inputs**          |HDMI, DVI, VGA                           |
|**Touch Interface** |USB 2.0 (HID-compliant)                  |
|**Speakers**        |Built-in stereo                          |
|**VESA Mount**      |100×100mm                                |
|**Condition**       |B-grade (cosmetic wear, fully functional)|
|**Price**           |£47.48                                   |
|**Source**          |eBay                                     |

**Purchase Notes:**

- Seller couldn't guarantee full touchscreen was working
- Came out of a functioning environment
- 30-day money back guarantee offered
- No USB touch cable included (purchased separately)

**Why This Monitor:**

- IPS panel provides excellent viewing angles (critical for kitchen/wall-mounted use)
- PCAP touch is the best touch technology (same as smartphones)
- Built-in speakers eliminate need for external audio
- £77.52 saved vs retail price (£125)

-----

### 2. Computer: Raspberry Pi 5 Starter Kit (8GB)

|Component         |Included                               |
|------------------|---------------------------------------|
|**Raspberry Pi 5**|8GB RAM model                          |
|**Power Supply**  |Official 27W USB-C (5.1V/5A)           |
|**Cooling**       |Official Active Cooler (fan + heatsink)|
|**Storage**       |32GB microSD with Raspberry Pi OS      |
|**Case**          |Included                               |
|**Cables**        |Micro-HDMI to HDMI                     |
|**Price**         |£114.90 (including postage)            |

**Future Upgrade Recommended:**

- 128GB microSD card (£12-18) - 32GB will fill up over time with logs, photos, and updates

-----

### 3. Cables

|Cable               |Purpose                       |Price            |
|--------------------|------------------------------|-----------------|
|**HDMI cable**      |Video from Pi to monitor      |Included in £7.63|
|**USB A-to-B cable**|Touch interface (monitor → Pi)|Included in £7.63|
|**Total**           |                              |£7.63            |

**Note:** The USB A-to-B cable is the standard "printer-style" cable. Required because the monitor's USB touch cable was not included.

-----

## Cost Summary

|Item                               |Price      |
|-----------------------------------|-----------|
|Acer T232HL monitor (eBay, B-grade)|£47.48     |
|Raspberry Pi 5 8GB Starter Kit     |£114.90    |
|HDMI + USB A-to-B cables           |£7.63      |
|**TOTAL**                          |**£170.01**|

-----

## Commercial Alternatives Compared

During research, these commercial products were evaluated:

|Product                |Price      |Notes                                    |
|-----------------------|-----------|-----------------------------------------|
|**Skylight Calendar**  |£299+      |Limited customization, subscription model|
|**Omi Hero HD Pro**    |£290-550   |Feature-rich but closed ecosystem        |
|**Dragon Touch**       |£200+      |Basic features, vendor lock-in           |
|**DIY Solution (ours)**|**£170.01**|Unlimited customization, no subscriptions|

**Savings vs cheapest commercial option:** £30-130+
**Additional benefits:** Full control, no vendor lock-in, unlimited customization, learning opportunity

-----

## Monitor Selection Process

Four monitors were evaluated before purchase:

### Evaluated Options

|Monitor             |Price |Panel|Touch     |Verdict                              |
|--------------------|------|-----|----------|-------------------------------------|
|**ViewSonic TD2430**|£74   |TN   |Optical/IR|Poor viewing angles, not recommended |
|**Dell S2240TB**    |£100  |IPS  |PCAP      |Good option, but Acer deal was better|
|**ViewSonic VG2455**|£68   |IPS  |None      |NOT a touchscreen - ruled out        |
|**Acer T232HL**     |£47.48|IPS  |PCAP      |**Selected** - best value            |

### Why IPS Panel Matters

- TN panels have poor viewing angles (colors shift when viewed from side)
- Family hub needs to be readable from multiple angles (kitchen, hallway, etc.)
- IPS provides consistent colors and brightness from any viewing position

### Why PCAP Touch Matters

- Same technology as smartphones/tablets
- More accurate and responsive than resistive or optical touch
- Multi-touch support (10 points)
- More durable than resistive screens

-----

## Physical Setup

### Connection Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Acer T232HL Monitor                 │
│                                                      │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │  Power   │    │   HDMI   │    │  USB-B   │     │
│   │  Input   │    │  Input   │    │  Touch   │     │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘     │
│        │               │               │            │
└────────┼───────────────┼───────────────┼────────────┘
         │               │               │
         │               │               │
    ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
    │  Mains  │    │   HDMI    │   │  USB A-B  │
    │  Power  │    │   Cable   │   │   Cable   │
    └─────────┘    └─────┬─────┘   └─────┬─────┘
                         │               │
                         │               │
         ┌───────────────┴───────────────┴───────────┐
         │           Raspberry Pi 5 8GB              │
         │                                            │
         │   ┌──────────┐  ┌──────────┐  ┌────────┐ │
         │   │ Micro-   │  │   USB    │  │ USB-C  │ │
         │   │ HDMI Out │  │  Ports   │  │ Power  │ │
         │   └──────────┘  └──────────┘  └───┬────┘ │
         └───────────────────────────────────┼──────┘
                                             │
                                    ┌────────┴────────┐
                                    │ 27W USB-C PSU   │
                                    │ (Official)      │
                                    └─────────────────┘
```

### Setup Steps

1. **Connect HDMI cable** from Pi (micro-HDMI port) to monitor (HDMI input)
1. **Connect USB A-to-B cable** from Pi (any USB-A port) to monitor (USB-B touch port)
1. **Connect power** to both monitor and Pi
1. **Power on monitor first**, then Pi
1. **Touchscreen should be plug-and-play** on Raspberry Pi OS

### Testing Touch Function

```bash
# In Raspberry Pi terminal, verify touch device detected:
lsusb

# Should show something like:
# Bus 001 Device 004: ID 0eef:0001 D-WAV Scientific Co., Ltd eGalax TouchScreen
# or
# Bus 001 Device 004: ID 04f3:016f Acer Touch Controller
```

**Touch Testing Checklist:**

- Touch all four corners - all areas responsive
- Touch center - accurate positioning
- Test multi-touch - two fingers simultaneously
- Test tap - registers as click

-----

## Future Hardware Considerations

### Recommended Upgrades

|Upgrade            |Priority|Cost  |Reason                            |
|-------------------|--------|------|----------------------------------|
|**128GB microSD**  |High    |£12-18|32GB will fill up with logs/photos|
|**NVMe SSD + HAT** |Medium  |£30-50|Better performance and longevity  |
|**VESA wall mount**|Low     |£10-15|For wall-mounted installation     |
|**USB speakers**   |Low     |£10-15|If built-in audio insufficient    |

### Storage Upgrade Path

**Current:** 32GB microSD (included with kit)

**Problem:** After 6-12 months:

- OS updates fill space
- Logs accumulate
- Photo cache grows
- Risk of "disk full" errors

**Solution Options:**

1. **Clone to 128GB microSD** (£12-18)
   - Use Raspberry Pi Imager to clone
   - Takes 30 minutes
   - Keep 32GB as backup

2. **NVMe SSD upgrade** (£30-50 for HAT + drive)
   - Better performance
   - Longer lifespan than SD cards
   - Boot from NVMe, keep SD as fallback

-----

## Troubleshooting

### Touch Not Working

1. Check USB cable firmly seated at both ends
1. Try different USB port on Pi
1. Reboot Pi
1. Run `lsusb` to verify touch controller detected
1. If not detected, USB cable may be faulty

### Display Not Showing

1. Verify HDMI cable connected
1. Check monitor is set to correct input (HDMI)
1. Try different HDMI port on monitor if available
1. Check Pi power LED is on

### Touch Inaccurate/Offset

1. Run touch calibration:

   ```bash
   sudo apt install xinput-calibrator
   xinput_calibrator
   ```

1. Follow on-screen instructions to tap calibration points

-----

## Specifications Reference

### Raspberry Pi 5 (8GB) Specs

|Spec        |Value                                          |
|------------|-----------------------------------------------|
|CPU         |Broadcom BCM2712, Quad-core Cortex-A76 @ 2.4GHz|
|RAM         |8GB LPDDR4X-4267                               |
|GPU         |VideoCore VII                                  |
|Storage     |microSD slot + optional NVMe via HAT           |
|Video Output|2× micro-HDMI (up to 4Kp60)                    |
|USB         |2× USB 3.0, 2× USB 2.0                         |
|Network     |Gigabit Ethernet, Wi-Fi 5, Bluetooth 5.0       |
|Power       |5V/5A via USB-C (27W recommended)              |

### Acer T232HL Specs

|Spec            |Value                  |
|----------------|-----------------------|
|Screen Size     |23" (58.4 cm)          |
|Resolution      |1920 × 1080 (Full HD)  |
|Panel Type      |IPS                    |
|Brightness      |300 cd/m²              |
|Contrast        |100,000,000:1 (dynamic)|
|Response Time   |5ms                    |
|Touch Technology|PCAP (10-point)        |
|Viewing Angles  |178°/178°              |
|Inputs          |HDMI, DVI, VGA         |
|Touch Interface |USB 2.0 HID            |
|Speakers        |2× 1.5W                |
|VESA Mount      |100 × 100mm            |

-----

**Document Version:** 1.0
**Last Updated:** December 2025
**Project:** Family Hub
**Owner:** James Brown
