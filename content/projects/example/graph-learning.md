## Project Snapshot

We investigated large-scale collaboration graphs to predict future co-authorship and identify emerging communities within computational science.

## Key Contributions

- Constructed a temporal graph of **42,000 researchers** across five IEEE/ACM venues.
- Designed a **temporal graph neural network (TGNN)** with attention-based node updates.
- Deployed an interactive dashboard for program chairs to explore trend forecasts.

## Pipeline

1. **Ingestion**  
   Scraped metadata from DBLP and CrossRef, normalizing author disambiguation via ORCID-linked heuristics.

2. **Feature Engineering**  
   - Node embeddings: Publication topics via doc2vec.
   - Edge features: Collaboration recency and publication impact.

3. **Model**  
   - Encoder: Temporal Graph Attention Network (TGAT).
   - Decoder: Link prediction with margin ranking loss.

## Results

- **AUC of 0.87** on future collaboration prediction (six-month horizon).
- Uncovered interdisciplinary clusters between HCI and ML venues two cycles ahead of formal tracks.

## Resources

- Dashboard prototype built with SvelteKit + Vega-Lite.
- Collaboration with the Program Committee of CSCW 2023.