/* global CMS */
if (window.CMS) {
  // Add some sane defaults so the preview isn't gigantic
  CMS.registerPreviewStyle(`
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.6; }
    article { max-width: 860px; padding: 16px; margin: 0 auto; }
    h1 { margin: 0 0 .25rem 0; line-height: 1.25; }
    p { margin: .5rem 0; }
    img, video, iframe { max-width: 100%; height: auto; display: block; }
    /* Markdown area */
    .markdown-preview img { max-width: 100%; height: auto; border-radius: 12px; }
    /* Mimic sticky title block */
    .title-block { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; text-align: left; }
    .title-block h1 { font-size: 1.5rem; font-weight: bold; }
    /* Score badge styles mimicking the actual */
    .article-score-badge { 
      position: relative; 
      width: 50px; 
      height: 50px; 
      border-radius: 50%; 
      background: linear-gradient(to bottom, #4CAF50, #388E3C); 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      font-weight: bold; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
    }
    .article-score-value { font-size: 1.2rem; }
    .article-score-label { font-size: 0.6rem; text-transform: uppercase; }
    /* Gallery preview mimicking carousel */
    .gallery-preview { 
      float: right; 
      width: 40%; 
      max-width: 420px; 
      margin-left: 1rem; 
      margin-bottom: 1rem; 
      overflow: hidden; 
      border-radius: 8px; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
    }
    .gallery-preview .main-image { 
      width: 100%; 
      height: auto; 
      display: block; 
      border-radius: 4px; 
      object-fit: contain;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    .gallery-preview .main-image.loaded { 
      opacity: 1;
    }
    .gallery-preview .thumbnails { 
      display: flex; 
      flex-wrap: wrap; 
      justify-content: center; 
      gap: 0.5rem; 
      margin-top: 0.5rem; 
    }
    .gallery-preview .thumbnail { 
      width: 60px; 
      height: 60px; 
      object-fit: cover; 
      cursor: pointer; 
      opacity: 0.5; 
      border-radius: 4px; 
      transition: opacity 0.2s; 
    }
    .gallery-preview .thumbnail:hover { 
      opacity: 0.75; 
    }
    .gallery-preview .thumbnail.active { 
      opacity: 1; 
    }
    /* Date and tags */
    .meta { font-size: 0.875rem; color: #666; margin-bottom: 1rem; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .tag { 
      background: #f0f0f0; 
      padding: 0.25rem 0.5rem; 
      border-radius: 4px; 
      font-size: 0.75rem; 
      text-decoration: none; 
      color: #333; 
    }
  `, { raw: true });

  const ArticlePreview = window.createClass({
    getInitialState() {
      return {
        currentIndex: 0
      };
    },

    render() {
      const { entry, widgetFor, getAsset } = this.props;

      const getIn = (path, fallback = "") => {
        const v = entry.getIn(path);
        return v === undefined || v === null ? fallback : v;
      };

      const title = getIn(["data", "title"]);
      const pubDateRaw = getIn(["data", "pubDate"]);
      const description = getIn(["data", "description"]);
      const score = getIn(["data", "score"]);
      const author = getIn(["data", "author"], "lyndonguitar");
      const category = getIn(["data", "category"]);

      // Format date like in the actual template
      let formattedDate = "";
      if (pubDateRaw) {
        const dateObj = new Date(pubDateRaw);
        formattedDate = new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(dateObj);
      }

      // Thumbnail handling
      let thumbUrl = "";
      const thumbValue = entry.getIn(["data", "thumb"]);
      if (thumbValue) {
        thumbUrl = getAsset(thumbValue).toString();
      }

      // Tags handling
      const tagsVal = entry.getIn(["data", "tags"]);
      const tags = tagsVal ? tagsVal.toJS() : [];

      // Gallery handling
      let galleryUrls = [];
      const galleryData = entry.getIn(["data", "gallery"]);
      if (galleryData) {
        galleryUrls = galleryData.map(item => {
          let imageValue = item;
          if (item && item.get) {
            imageValue = item.get("image");
          }
          return imageValue ? getAsset(imageValue).toString() : null;
        }).filter(Boolean).toJS();
      }

      const bodyEl = widgetFor && widgetFor("body");

      return window.h(
        "article",
        null,
        [
          // Sticky title block mimic with score and title
          window.h("div", { className: "title-block" }, [
            (typeof score !== "undefined" && score !== null) && window.h("div", { className: "article-score-badge" }, [
              window.h("span", { className: "article-score-value" }, String(score)),
              window.h("span", { className: "article-score-label" }, "Score"),
            ]),
            title && window.h("h1", null, title),
          ]),

          // Meta: date, author, category
          window.h("div", { className: "meta" }, [
            formattedDate,
            formattedDate && " • ",
            author,
            category && ` • Category: ${category}`,
          ]),

          // Tags
          tags.length > 0 && window.h("div", { className: "tags" }, 
            tags.map(tag => window.h("a", { className: "tag", href: "#" }, tag))
          ),

          // Description
          description && window.h("p", null, description),

          // Gallery preview as floated div mimicking carousel
          galleryUrls.length > 0 && window.h("div", { className: "gallery-preview" }, [
            window.h("img", { 
              className: "main-image",
              src: galleryUrls[this.state.currentIndex], 
              alt: "Gallery image",
              onLoad: (e) => { e.target.classList.add('loaded'); }
            }),
            window.h("div", { className: "thumbnails" }, 
              galleryUrls.map((img, i) => window.h("img", { 
                className: `thumbnail ${i === this.state.currentIndex ? 'active' : ''}`,
                src: img, 
                alt: "Thumbnail",
                onClick: () => this.setState({ currentIndex: i })
              }))
            )
          ]),

          // Thumbnail as large image if no gallery
          thumbUrl && galleryUrls.length === 0 && window.h("img", {
            src: thumbUrl,
            alt: "Thumbnail",
            style: {
              width: "100%",
              height: "auto",
              objectFit: "cover",
              borderRadius: "12px",
              margin: "1rem 0"
            }
          }),

          window.h("hr", { style: { margin: "1rem 0", clear: "both" } }),

          // Body markdown preview
          window.h("div", { className: "markdown-preview" }, bodyEl || null),
        ]
      );
    }
  });

  CMS.registerPreviewTemplate("article", ArticlePreview);
  CMS.registerPreviewTemplate("submissions", ArticlePreview); 
}