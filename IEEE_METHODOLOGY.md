
### A. System Design

The FIRE (Food Image to Recipe) system consists of three integrated components designed to transform food images into complete recipes. The first component generates recipe titles from food images using state-of-the-art image captioning techniques. The second component extracts ingredients from images using vision transformers and decoder layers with attention mechanisms. The third component generates cooking instructions based on the generated title and extracted ingredients using an encoder-decoder model. This modular architecture ensures each component can be optimized independently while maintaining seamless integration for end-to-end recipe generation from visual input.

### B. Data Collection

The FIRE system utilizes the Recipe1M dataset as the primary data source, which contains over one million recipes with corresponding food images. Each data sample consists of a food image paired with its associated recipe, including title, ingredient list, and cooking instructions. The dataset provides a comprehensive collection of diverse food categories, cooking styles, and ingredient combinations, enabling robust training of the multimodal models. Additional data augmentation techniques are employed to increase dataset diversity, including image transformations such as rotation, scaling, and color adjustments to improve model generalization across different lighting conditions and camera perspectives.

### C. Data Preprocessing

Raw data from the Recipe1M dataset undergoes several preprocessing steps to prepare it for model training. Images are resized to a consistent resolution and normalized using standard image preprocessing techniques. Ingredient lists are tokenized and converted into binary vectors representing presence or absence of ingredients from a predefined vocabulary. Cooking instructions are parsed and structured into sequential steps. For the ingredient extraction task, ingredients are represented as sets rather than ordered lists, acknowledging that ingredient order does not affect the final recipe outcome. Text data is cleaned to remove noise and standardized formatting, ensuring consistency across different recipe sources.

### D. Model Development

The FIRE system employs multiple specialized models for different components. For title generation, the BLIP model is fine-tuned on a subset of the Recipe1M dataset to generate concise, recipe-relevant titles from food images. The fine-tuning process addresses domain shift by adapting the general-purpose image captioning model to focus on food-specific features while removing extraneous details. For ingredient extraction, a vision transformer (ViT) serves as the feature extractor, followed by a custom decoder with self-attention and conditional attention layers. The decoder processes image embeddings through multiple normalization and fully connected layers to predict ingredient sets. The loss function combines binary cross-entropy for ingredient prediction, EOS loss for sequence termination, and cardinality penalty to ensure accurate ingredient list lengths. For cooking instruction generation, the T5 encoder-decoder model is fine-tuned on formatted inputs combining recipe titles and ingredient lists to generate coherent cooking instructions.

### E. Workflow Implementation

The FIRE workflow follows a sequential pipeline that transforms food images into complete recipes. Users input food images, which are first processed by the fine-tuned BLIP model to generate appropriate recipe titles. The same images are then fed through the vision transformer and ingredient decoder to extract relevant ingredients. The generated title and ingredient list are combined and passed to the fine-tuned T5 model to generate cooking instructions. Each component operates independently but shares learned representations to ensure consistency across the pipeline. The system handles various edge cases, such as ambiguous ingredients or incomplete visual information, through confidence scoring and fallback mechanisms.

### F. Tools and Technologies Used

The FIRE system is implemented using PyTorch as the primary deep learning framework, providing efficient tensor operations and automatic differentiation for model training. The vision transformer implementation utilizes the Hugging Face Transformers library, which offers pre-trained ViT models and fine-tuning capabilities. The BLIP model is accessed through the LAVIS library, enabling easy integration of state-of-the-art vision-language models. T5 model implementation uses the Hugging Face Transformers library with custom fine-tuning scripts. Data preprocessing and augmentation are handled using OpenCV and Albumentations libraries. The system runs on NVIDIA GPUs with CUDA acceleration for efficient training and inference. Model evaluation and metrics computation utilize scikit-learn and custom evaluation scripts.

### G. Evaluation Strategy

The FIRE methodology includes comprehensive evaluation protocols to assess system performance across all components. Title generation is evaluated using BLEU scores, ROUGE metrics, and human evaluation for caption quality and relevance. Ingredient extraction performance is measured through precision, recall, and F1-score metrics, with additional analysis of false positives and false negatives. Cooking instruction generation is evaluated using BLEU scores for n-gram overlap with ground truth instructions and human assessment of instruction clarity and completeness. The complete pipeline is evaluated end-to-end using recipe completion accuracy and user satisfaction surveys. Ablation studies are conducted to assess the contribution of each component to overall system performance. Cross-validation techniques ensure robust performance estimation across different data splits.


