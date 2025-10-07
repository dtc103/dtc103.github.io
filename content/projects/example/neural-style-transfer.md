## Overview

We explored how neural style transfer techniques can amplify structural cues in low-dose CT scans without introducing diagnostic artifacts. This project was conducted in partnership with the Radiology Department at Example Medical Center.

## Objectives

- Enhance the visibility of vascular structures in low-contrast imaging.
- Preserve original diagnostic fidelity while improving clinician confidence.
- Evaluate effectiveness via randomized reader studies with attending radiologists.

## Methodology

1. **Data Collection**  
   We curated 2,800 anonymized scans, balancing across anatomical regions and scan protocols.

2. **Model Architecture**  
   - Base: Adaptive Instance Normalization (AdaIN) network.
   - Style bank: Learned from high-signal, contrast-enhanced scans.
   - Content preservation enforced via structural similarity (SSIM) loss.

3. **Evaluation Metrics**  
   - Quantitative: PSNR, SSIM, and radiologist scoring.
   - Qualitative: Think-aloud protocol during reading sessions.

```python
# Key training loop snippet
for batch in dataloader:
    content, style = batch
    stylized = model(content, style)
    loss = content_loss(content, stylized) + style_loss(style, stylized)
    loss.backward()
    optimizer.step()
```

Outcomes

Achieved a 19% improvement in radiologist agreement scores.
Reduced average diagnosis time by 11% in low-dose scenarios.
Published findings at MICCAI 2024 and open-sourced tooling to encourage replication.

Next Steps

Expand evaluation to multi-site cohorts.
Integrate uncertainty quantification to signal low-confidence transforms.


