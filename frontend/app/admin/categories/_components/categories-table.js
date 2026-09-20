"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_TYPES,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import LocalTime from "../../_components/local-time";
import FormAlert from "../../_components/form-alert";

/**
 * The categories list: search, an inline "new category" form, the table, and
 * per-row edit/delete.
 *
 * There is no paging here - the same way the blog's tag list has none - a
 * handful of categories is the realistic ceiling for a site like this one.
 * The server renders the first list and hands it over as `initial`, so the
 * table is in the HTML before any JavaScript runs.
 */

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-black/35"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" />
    </svg>
  );
}

// A name and a slug field, shared between the "new category" panel and a
// row's own edit form. autoFocus only matters for the former; a row already
// has focus from the Edit click that opened it.
function CategoryFields({ name, onNameChange, disabled, idPrefix, autoFocus }) {
  return (
    <div>
      <label htmlFor={`${idPrefix}-name`} className="sr-only">
        Category name
      </label>
      <input
        id={`${idPrefix}-name`}
        type="text"
        required
        autoFocus={autoFocus}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        disabled={disabled}
        placeholder="e.g. Brand Strategy"
        className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none disabled:bg-black/[0.03]"
      />
    </div>
  );
}

export default function CategoriesTable({ initial }) {
  const [type, setType] = useState("blog");
  const typeLabel = type === "blog" ? "blog" : "case study";
  const [categories, setCategories] = useState(initial.categories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [rowError, setRowError] = useState("");

  const [busyId, setBusyId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  const isFirstRun = useRef(true);

  // Wait for a pause in typing before asking the API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const reload = (nextSearch = search) => {
    setLoading(true);
    setError("");

    return getCategories({ search: nextSearch, type })
      .then((payload) => {
        setCategories(payload.data.categories);
      })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getCategories({ search, type })
      .then((payload) => {
        if (cancelled) return;
        setCategories(payload.data.categories);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, type]);

  const switchType = (nextType) => {
    if (nextType === type) return;
    setType(nextType);
    setShowNewForm(false);
    setNewName("");
    setCreateError("");
    setEditingId(null);
    setConfirmingDelete(null);
    setRowError("");
  };

  const openNewForm = () => {
    setNewName("");
    setCreateError("");
    setShowNewForm(true);
  };

  const cancelNewForm = () => {
    setShowNewForm(false);
    setNewName("");
    setCreateError("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setCreateError("");

    try {
      await createCategory({ name: newName.trim(), type });
      setShowNewForm(false);
      setNewName("");
      await reload();
    } catch (requestError) {
      setCreateError(requestError.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setRowError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setRowError("");
  };

  const handleSaveEdit = async (category) => {
    if (!editName.trim()) return;

    setSavingId(category.id);
    setRowError("");

    try {
      await updateCategory(category.id, { name: editName.trim() });
      setEditingId(null);
      await reload();
    } catch (requestError) {
      setRowError(requestError.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (category) => {
    setBusyId(category.id);
    setError("");

    try {
      await deleteCategory(category.id);
      setConfirmingDelete(null);
      await reload();
    } catch (requestError) {
      setError(requestError.message);
      setConfirmingDelete(null);
    } finally {
      setBusyId(null);
    }
  };

  const isFiltered = search !== "";

  return (
    <div>
      {/* Which list: blog or case study categories -------------------------- */}
      <div
        role="tablist"
        aria-label="Category list"
        className="mb-5 inline-flex rounded-xl border border-black/15 bg-white p-1"
      >
        {CATEGORY_TYPES.map((option) => {
          const active = option.value === type;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchType(option.value)}
              className={`font-nav rounded-lg px-5 py-2.5 text-xs font-bold tracking-[0.08em] uppercase transition-colors ${
                active ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Controls ----------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="category-search" className="sr-only">
            Search categories
          </label>
          <SearchIcon />
          <input
            id="category-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-xl border border-black/15 bg-white py-3 pr-4 pl-11 text-base text-foreground transition-colors placeholder:text-black/35 focus:border-navy focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="font-nav shrink-0 bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
        >
          New category
        </button>
      </div>

      {/* New category panel -------------------------------------------------- */}
      {showNewForm ? (
        <form
          onSubmit={handleCreate}
          className="mt-4 rounded-2xl border border-black/10 bg-white p-5"
        >
          <FormAlert message={createError} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <CategoryFields
                name={newName}
                onNameChange={setNewName}
                disabled={creating}
                idPrefix="new-category"
                autoFocus
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="submit"
                disabled={creating}
                className="font-nav bg-navy px-5 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelNewForm}
                disabled={creating}
                className="font-nav border border-black/15 px-5 py-3 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/25 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {/* Results ------------------------------------------------------------ */}
      <div
        className={`mt-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
        aria-busy={loading}
      >
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
            <p className="font-headline text-xl tracking-tight text-navy uppercase">
              {isFiltered ? "Nothing matches" : "No categories yet"}
            </p>
            <p className="mt-3 text-sm text-black/55">
              {isFiltered
                ? "Try a different search term."
                : `Add your first category to start organising the ${typeLabel === "blog" ? "blog" : "case studies"}.`}
            </p>
            {isFiltered ? null : (
              <button
                type="button"
                onClick={openNewForm}
                className="font-nav mt-6 inline-block bg-navy px-6 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90"
              >
                New category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: a real table. */}
            <div className="hidden overflow-hidden rounded-2xl border border-black/10 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  {typeLabel} categories, alphabetical
                </caption>
                <thead>
                  <tr className="border-b border-black/10 bg-black/[0.02]">
                    {["Name", "Slug", "Created", ""].map((heading, index) => (
                      <th
                        key={heading || index}
                        scope="col"
                        className="font-nav px-5 py-3.5 text-xs font-bold tracking-[0.14em] text-muted uppercase"
                      >
                        {heading || <span className="sr-only">Actions</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const isEditing = editingId === category.id;

                    return (
                      <tr
                        key={category.id}
                        className="border-b border-black/[0.06] last:border-0 align-middle hover:bg-footer/60"
                      >
                        {isEditing ? (
                          <td colSpan={4} className="px-5 py-4">
                            <FormAlert message={rowError} />
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                              <div className="flex-1">
                                <CategoryFields
                                  name={editName}
                                  onNameChange={setEditName}
                                  disabled={savingId === category.id}
                                  idPrefix={`edit-category-${category.id}`}
                                  autoFocus
                                />
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(category)}
                                  disabled={savingId === category.id}
                                  className="font-nav bg-navy px-5 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingId === category.id ? "Saving…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  disabled={savingId === category.id}
                                  className="font-nav border border-black/15 px-5 py-3 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-5 py-4 text-sm font-semibold text-foreground">
                              {category.name}
                            </td>
                            <td className="px-5 py-4 text-sm text-black/50">{category.slug}</td>
                            <td className="px-5 py-4 text-sm whitespace-nowrap text-black/60">
                              <LocalTime value={category.createdAt} />
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <RowActions
                                  category={category}
                                  busy={busyId === category.id}
                                  confirming={confirmingDelete === category.id}
                                  onEdit={() => startEdit(category)}
                                  onAskDelete={() => setConfirmingDelete(category.id)}
                                  onCancelDelete={() => setConfirmingDelete(null)}
                                  onDelete={() => handleDelete(category)}
                                />
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: the same rows as cards. */}
            <ul className="space-y-3 md:hidden">
              {categories.map((category) => {
                const isEditing = editingId === category.id;

                return (
                  <li key={category.id} className="rounded-2xl border border-black/10 bg-white p-5">
                    {isEditing ? (
                      <>
                        <FormAlert message={rowError} />
                        <CategoryFields
                          name={editName}
                          onNameChange={setEditName}
                          disabled={savingId === category.id}
                          idPrefix={`edit-category-m-${category.id}`}
                          autoFocus
                        />
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(category)}
                            disabled={savingId === category.id}
                            className="font-nav flex-1 bg-navy px-5 py-3 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingId === category.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingId === category.id}
                            className="font-nav flex-1 border border-black/15 px-5 py-3 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold break-words text-foreground">
                              {category.name}
                            </p>
                            <p className="mt-0.5 text-sm break-all text-black/50">
                              {category.slug}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-sm text-black/50">
                            <LocalTime value={category.createdAt} />
                          </span>
                          <div className="flex items-center gap-2">
                            <RowActions
                              category={category}
                              busy={busyId === category.id}
                              confirming={confirmingDelete === category.id}
                              onEdit={() => startEdit(category)}
                              onAskDelete={() => setConfirmingDelete(category.id)}
                              onCancelDelete={() => setConfirmingDelete(null)}
                              onDelete={() => handleDelete(category)}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-black/55">
        {categories.length} {categories.length === 1 ? "category" : "categories"}
      </p>
    </div>
  );
}

/**
 * Edit and delete for one row.
 *
 * The delete confirmation replaces the buttons in place rather than opening a
 * window.confirm() - same reasoning as the case studies list.
 */
function RowActions({ category, busy, confirming, onEdit, onAskDelete, onCancelDelete, onDelete }) {
  if (confirming) {
    return (
      <>
        <span className="text-sm font-semibold text-foreground">Delete?</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="font-nav bg-red-600 px-3 py-2 text-xs font-bold tracking-[0.08em] text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Yes"}
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          disabled={busy}
          className="font-nav border border-black/15 px-3 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
        >
          No
        </button>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        className="font-nav border border-black/15 px-3.5 py-2 text-xs font-bold tracking-[0.08em] text-navy uppercase transition-colors hover:bg-navy hover:text-white disabled:opacity-50"
      >
        Edit
        <span className="sr-only"> {category.name}</span>
      </button>

      <button
        type="button"
        onClick={onAskDelete}
        disabled={busy}
        className="font-nav px-2 py-2 text-xs font-bold tracking-[0.08em] text-red-600 uppercase transition-colors hover:underline disabled:opacity-50"
      >
        Delete
        <span className="sr-only"> {category.name}</span>
      </button>
    </>
  );
}
