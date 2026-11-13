import { useState } from "react";
import { moveItem, syncShopMenu, uid } from "../data/store";

function Field({ label, value, onChange, area, hint }) {
  const Tag = area ? "textarea" : "input";
  return (
    <label className="field">
      <span>{label}</span>
      <Tag value={value || ""} rows={area || undefined} onChange={(event) => onChange(event.target.value)} />
      {hint ? <small className="fine">{hint}</small> : null}
    </label>
  );
}

export default function ProductsPanel({ draft, patch }) {
  const [index, setIndex] = useState(-1);
  const product = draft.products?.[index];

  if (product) {
    return (
      <div>
        <button type="button" className="text-link back" onClick={() => setIndex(-1)}>All products</button>
        <h1>{product.name || "Product"}</h1>
        <Field label="Name" value={product.name} onChange={(value) => patch((next) => { next.products[index].name = value; })} />
        <Field label="Slug" value={product.slug} hint="Used in the address. It is cleaned when you save." onChange={(value) => patch((next) => { next.products[index].slug = value; })} />
        <label className="field">
          <span>Category</span>
          <select value={product.category || ""} onChange={(event) => patch((next) => { next.products[index].category = event.target.value; })}>
            {(draft.productCategories || []).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <Field label="Price" value={product.price} onChange={(value) => patch((next) => { next.products[index].price = value; })} />
        <Field label="One-line description" value={product.blurb} onChange={(value) => patch((next) => { next.products[index].blurb = value; })} />
        <Field label="Page story" area={5} value={product.description} onChange={(value) => patch((next) => { next.products[index].description = value; })} />
        <Field label="Shop button label" value={product.buyLabel} onChange={(value) => patch((next) => { next.products[index].buyLabel = value; })} />
        <Field label="Shop link" value={product.buyUrl} hint="Leave this empty and the site shows no checkout. Buyzaar does not take payment." onChange={(value) => patch((next) => { next.products[index].buyUrl = value; })} />
        <Field label="Search title" value={product.seoTitle} onChange={(value) => patch((next) => { next.products[index].seoTitle = value; })} />
        <Field label="Search description" area={3} value={product.seoDescription} onChange={(value) => patch((next) => { next.products[index].seoDescription = value; })} />
        <div className="check-row">
          <label className="check"><input type="checkbox" checked={product.visible !== false} onChange={(event) => patch((next) => { next.products[index].visible = event.target.checked; })} /> Visible</label>
          <label className="check"><input type="checkbox" checked={!!product.featured} onChange={(event) => patch((next) => { next.products[index].featured = event.target.checked; })} /> Featured</label>
        </div>
        <h2>Specs</h2>
        {(product.specs || []).map((spec, specIndex) => (
          <div className="pair" key={`${spec.label}-${specIndex}`}>
            <input value={spec.label} placeholder="Label" onChange={(event) => patch((next) => { next.products[index].specs[specIndex].label = event.target.value; })} />
            <input value={spec.value} placeholder="Value" onChange={(event) => patch((next) => { next.products[index].specs[specIndex].value = event.target.value; })} />
            <button type="button" onClick={() => patch((next) => { next.products[index].specs.splice(specIndex, 1); })}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => patch((next) => { next.products[index].specs.push({ label: "", value: "" }); })}>Add a spec</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Products</h1>
      <p className="fine">Sample names and prices stay until you replace them. Comparison reads the spec rows. An empty shop link means there is no buy button.</p>
      <h2>Categories</h2>
      {(draft.productCategories || []).map((category, categoryIndex) => (
        <div className="pair" key={category.id || categoryIndex}>
          <input value={category.name} placeholder="Name" onChange={(event) => patch((next) => { next.productCategories[categoryIndex].name = event.target.value; })} />
          <input value={category.id} placeholder="Id" onChange={(event) => patch((next) => { next.productCategories[categoryIndex].id = event.target.value; })} />
          <input value={category.blurb} placeholder="Short line" onChange={(event) => patch((next) => { next.productCategories[categoryIndex].blurb = event.target.value; })} />
          <button type="button" onClick={() => patch((next) => { next.productCategories.splice(categoryIndex, 1); })}>Remove</button>
        </div>
      ))}
      <div className="plist-bar">
        <button
          type="button"
          onClick={() => patch((next) => {
            next.productCategories.push({ id: `category-${uid("c").slice(-4)}`, name: "New category", blurb: "" });
          })}
        >
          Add a category
        </button>
        <button type="button" onClick={() => patch((next) => Object.assign(next, syncShopMenu(next)))}>Update the Shop menu</button>
      </div>
      <h2>Products</h2>
      <button
        type="button"
        onClick={() => patch((next) => {
          next.products.push({
            slug: `product-${uid("p").slice(-4)}`,
            name: "New product",
            category: next.productCategories[0]?.id || "",
            price: 0,
            blurb: "",
            description: "",
            specs: [{ label: "Storage", value: "" }],
            featured: false,
            visible: true,
            buyLabel: "Open the shop",
            buyUrl: "",
            tone: "#d5e4f7",
            seoTitle: "",
            seoDescription: "",
          });
        })}
      >
        Add a product
      </button>
      <table className="grid-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(draft.products || []).map((item, itemIndex) => (
            <tr key={item.slug || itemIndex}>
              <td><button type="button" className="text-link" onClick={() => setIndex(itemIndex)}>{item.name || "Untitled"}</button></td>
              <td>{item.category}</td>
              <td>{item.price}</td>
              <td>
                <button type="button" onClick={() => patch((next) => { next.products = moveItem(next.products, itemIndex, -1); })}>Up</button>
                <button type="button" onClick={() => patch((next) => { next.products = moveItem(next.products, itemIndex, 1); })}>Down</button>
                <button type="button" onClick={() => patch((next) => { next.products.splice(itemIndex, 1); })}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
