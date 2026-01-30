---
name: biometric-expert
description: Domain expertise for biometric data interpretation and decision-making systems. Use when working on features that analyze, interpret, or act on biometric data including HRV, sleep, activity, cognitive load, and stress markers. Essential for designing decision algorithms, data processing pipelines, and behavioral nudge mechanisms.
---

# Biometric Decision Engine Expert

## Role

You are a domain expert in biometric data interpretation and decision-making systems for high-performers.

## Core Expertise Areas

### 1. Biometric Data Types & Interpretation

#### Heart Rate Variability (HRV)
- **What it measures**: Autonomic nervous system balance
- **Key metrics**: RMSSD, SDNN, pNN50
- **Interpretation patterns**:
  - High HRV baseline = good recovery, stress resilience
  - Morning HRV drop = need recovery day
  - Trend matters more than single value
- **Decision signals**: 
  - <20% below baseline → reduce intensity
  - >10% above baseline → opportunity for hard work
  - Consistent decline over 3+ days → mandatory rest

#### Sleep Metrics
- **Key stages**: Deep, REM, Light, Awake
- **Optimal ratios**: 
  - Deep: 13-23% (physical recovery)
  - REM: 20-25% (cognitive recovery)
  - Sleep efficiency: >85%
- **Decision signals**:
  - <1hr deep sleep → avoid heavy physical work
  - <1.5hr REM → avoid complex cognitive tasks
  - Poor efficiency → investigate sleep hygiene

#### Resting Heart Rate (RHR)
- **Baseline significance**: 5-10 bpm above baseline = stress/overtraining
- **Trend analysis**: Rising RHR over days = cumulative fatigue
- **Decision signals**: Elevated RHR → postpone high-intensity decisions

#### Activity & Strain
- **Cumulative load**: Track weekly volume vs. capacity
- **Recovery ratio**: Rest days should match hard days
- **Decision signals**: High strain + low recovery = injury risk

#### Respiratory Rate
- **Baseline**: 12-20 breaths/min during sleep
- **Stress indicator**: Elevated rate = sympathetic activation
- **Decision signals**: Combine with HRV for stress load

#### Body Temperature
- **Illness detection**: 0.5°C deviation = immune response
- **Circadian rhythm**: Peak performance 2-4hrs after temp peak
- **Decision signals**: Abnormal temp → reduce cognitive load

### 2. Decision-Making Patterns for High-Performers

#### Morning Decision Protocol
```
1. Check HRV trend (3-day)
2. Assess sleep quality (efficiency + stages)
3. Consider calendar (meetings, deadlines)
4. Generate decision capacity score (0-100)
5. Nudge: Reschedule low-ROI tasks if capacity < 60
```

#### Workout Timing Optimization
```
IF (deep_sleep < 1hr OR hrv_drop > 20%):
    NUDGE: "Light movement only - your body needs recovery"
ELSE IF (hrv > baseline AND deep_sleep > 1.5hr):
    NUDGE: "Peak recovery state - good day for PR attempt"
ELSE:
    NUDGE: "Moderate intensity - maintain consistency"
```

#### Cognitive Work Scheduling
```
PEAK_HOURS = body_temp_peak + 2hrs to 4hrs
IF (rem_sleep < 1.5hr):
    NUDGE: "Move deep work to tomorrow, focus on execution today"
ELSE IF (current_time in PEAK_HOURS AND hrv > baseline):
    NUDGE: "Prime time for complex problem-solving"
```

### 3. Behavioral Nudge Design

#### Effective Nudge Patterns

**Pattern 1: Data + Impact + Action**
```
❌ "Your HRV is 45ms"
✅ "Your HRV is 20% below baseline. Taking a rest day could prevent 3 days of forced recovery. Reschedule your workout?"
```

**Pattern 2: Opportunity Framing**
```
❌ "You slept well"
✅ "Peak recovery detected. Next 4 hours are ideal for your quarterly strategy session. Block your calendar?"
```

**Pattern 3: Risk Prevention**
```
❌ "High strain detected"
✅ "3 days of elevated strain + declining HRV = 73% injury risk. Scale back intensity 30% this week?"
```

**Pattern 4: Counterfactual Projection**
```
"If you push through today's workout despite low HRV:
- 60% chance of 3-day recovery penalty
- 40% chance of productive session

If you take active recovery:
- 90% chance of strong performance tomorrow
- 0% injury risk

Recommended: Light 20-min walk today, resume training tomorrow"
```

#### Nudge Timing Principles
- **Morning**: Recovery status + day optimization
- **Pre-decision**: Intervention before mistakes
- **Post-activity**: Reinforcement learning
- **Weekly**: Trend analysis + planning

### 4. Data Processing Best Practices

#### Baseline Calculation
```python
# HRV baseline: 30-day rolling average (exclude outliers)
baseline = np.median(hrv_last_30_days[hrv_last_30_days > 0])
threshold_low = baseline * 0.8  # 20% drop
threshold_high = baseline * 1.1  # 10% increase
```

#### Signal Smoothing
- Use 3-day rolling average for trend detection
- Single-day anomalies should not trigger decisions
- Combine multiple signals for confidence

#### Missing Data Handling
- HRV: Interpolate up to 1 day, otherwise skip
- Sleep: Cannot interpolate, use previous day's recovery status
- Activity: Assume baseline maintenance level

### 5. Integration Patterns

#### API Data Collection
```python
# Morning data pull sequence
1. Fetch overnight sleep data (Oura/Whoop)
2. Calculate sleep scores (deep, REM, efficiency)
3. Fetch morning HRV reading
4. Retrieve RHR and respiratory rate
5. Pull previous day's activity strain
6. Compute recovery score
7. Generate decision capacity
```

#### Real-time Nudging
```python
# Calendar integration example
IF morning_recovery < 60:
    scan_calendar_today()
    identify_high_cognitive_load_meetings()
    suggest_reschedule(top_3_draining_meetings)
```

#### Feedback Loop
```python
# Track nudge effectiveness
1. Suggest action based on biometrics
2. User accepts/declines
3. Measure next-day biometric response
4. Update nudge effectiveness score
5. Personalize future recommendations
```

## Common Use Cases

### Use Case 1: Morning Optimization
**Input**: Sleep data, HRV, RHR, calendar
**Process**: Calculate recovery, assess calendar load, identify optimization opportunities
**Output**: Personalized daily plan with meeting/workout timing nudges

### Use Case 2: Workout Decision
**Input**: HRV trend, sleep quality, cumulative strain
**Process**: Risk assessment, recovery status, performance prediction
**Output**: Go/no-go decision with intensity recommendation

### Use Case 3: Cognitive Performance Window
**Input**: REM sleep, body temp, time of day, meeting complexity
**Process**: Predict cognitive capacity, identify peak windows
**Output**: Meeting scheduling nudges

### Use Case 4: Weekly Planning
**Input**: 7-day biometric trends, performance outcomes, planned load
**Process**: Pattern recognition, stress accumulation analysis
**Output**: Week structure optimization with rest day placement

## Implementation Checklist

When implementing biometric features:

- [ ] Define clear baseline calculation method
- [ ] Implement 3-day trend smoothing
- [ ] Handle missing data gracefully
- [ ] Use multiple signals for confidence
- [ ] Design counterfactual comparisons
- [ ] Include actionable recommendations
- [ ] Track nudge acceptance rates
- [ ] Measure outcome improvements
- [ ] Personalize thresholds over time

## API Reference Quick Links

- **Oura**: Daily sleep, HRV, RHR, body temp, activity
- **Whoop**: Recovery score, strain, sleep stages, HRV
- **Apple Health**: Continuous HR, workout data, sleep analysis
- **Garmin**: Training load, recovery time, stress score

## Red Flags in Biometric Data

⚠️ Immediate attention needed:
- HRV < 50% of baseline for 2+ consecutive days
- RHR > 15 bpm above baseline
- Sleep efficiency < 70% for 3+ nights
- Strain accumulation without recovery days
- Body temp deviation > 0.5°C

## Advanced: Personalization Engine

Track individual response patterns:
- HRV sensitivity (some users need 30% drop for rest, others 15%)
- Sleep quality impact (deep vs REM importance varies)
- Workout recovery time (genetic differences)
- Stress resilience (adaptation to high cognitive load)

Build personalized thresholds after 30 days of data + outcome tracking.

## When to Use This Skill

Load this skill when:
- Designing biometric data processing algorithms
- Creating decision logic for features
- Interpreting biometric API responses
- Designing nudge mechanisms
- Building recovery/readiness scoring systems
- Implementing personalization engines
- Debugging unexpected biometric patterns
