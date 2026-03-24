import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

function normalizeMovieId(movie) {
  const id = movie?.id ?? movie?.movieId;
  return id != null ? Number(id) : NaN;
}

export default function MovieDetailModal({
  movie,
  isOpen,
  onClose,
  token,
  isLoggedIn,
  user,
}) {
  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [commentBusyId, setCommentBusyId] = useState(null);
  const [commentActionError, setCommentActionError] = useState(null);

  const movieId = movie ? normalizeMovieId(movie) : NaN;

  const isOwnComment = (c) =>
    isLoggedIn &&
    user != null &&
    String(c.userId) === String(user.id);

  const authHeaders = token
    ? { "Content-Type": "application/json", Authorization: token }
    : { "Content-Type": "application/json" };

  const loadComments = useCallback(async () => {
    if (!Number.isFinite(movieId)) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/movies/${movieId}/comments`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load comments");
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    if (!isOpen || !movie || !Number.isFinite(movieId)) {
      setDetails(null);
      setDetailsError(null);
      return;
    }

    setDetails(null);
    setDetailsError(null);

    const fromListOverview = movie.overview || null;

    fetch(`${API_BASE}/api/movies/${movieId}/details`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDetailsError(data.message || "Could not load full details.");
          setDetails({
            notFound: true,
            title: movie.title,
            overview: fromListOverview,
            poster_path: movie.poster_path || movie.posterPath,
            release_date: movie.release_date || movie.releaseDate,
          });
          return;
        }
        setDetailsError(null);
        if (data.message && !data.title && data.message.includes("not configured")) {
          setDetails({
            notFound: true,
            title: movie.title || null,
            overview: fromListOverview,
            poster_path: movie.poster_path || null,
            release_date: movie.release_date || movie.releaseDate || null,
          });
          setDetailsError(null);
          return;
        }
        if (data.notFound) {
          setDetails({
            notFound: true,
            title: movie.title || data.title,
            overview: fromListOverview || data.overview,
            poster_path: movie.poster_path || movie.posterPath || data.poster_path,
            release_date: movie.release_date || movie.releaseDate || data.release_date,
          });
        } else {
          setDetails({
            notFound: false,
            title: data.title || movie.title,
            overview: data.overview || fromListOverview,
            poster_path: data.poster_path || movie.poster_path,
            release_date: data.release_date || movie.release_date || movie.releaseDate,
            runtime: data.runtime,
          });
        }
      })
      .catch(() => {
        setDetailsError("Could not load full details.");
        setDetails({
          notFound: true,
          title: movie.title,
          overview: fromListOverview,
          poster_path: movie.poster_path || movie.posterPath,
          release_date: movie.release_date || movie.releaseDate,
        });
      });
  }, [isOpen, movie, movieId]);

  useEffect(() => {
    if (!isOpen || !Number.isFinite(movieId)) {
      setComments([]);
      setCommentText("");
      setPostError(null);
      setEditingId(null);
      setEditText("");
      setCommentBusyId(null);
      setCommentActionError(null);
      return;
    }
    loadComments();
  }, [isOpen, movieId, loadComments]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !token || !Number.isFinite(movieId)) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch(`${API_BASE}/api/movies/${movieId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not post comment");
      setComments((prev) => [...prev, data]);
      setCommentText("");
    } catch (err) {
      setPostError(err.message || "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (c) => {
    setCommentActionError(null);
    setEditingId(c._id);
    setEditText(c.text || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setCommentActionError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const text = editText.trim();
    if (!text || !token || !editingId || !Number.isFinite(movieId)) return;
    setCommentBusyId(editingId);
    setCommentActionError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/movies/${movieId}/comments/${editingId}`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not update comment");
      setComments((prev) =>
        prev.map((row) => (row._id === editingId ? { ...row, ...data } : row)),
      );
      cancelEdit();
    } catch (err) {
      setCommentActionError(err.message || "Could not update comment");
    } finally {
      setCommentBusyId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token || !Number.isFinite(movieId)) return;
    if (!window.confirm("Delete this comment?")) return;
    setCommentBusyId(commentId);
    setCommentActionError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/movies/${movieId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: token },
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete comment");
      setComments((prev) => prev.filter((row) => row._id !== commentId));
      if (editingId === commentId) cancelEdit();
    } catch (err) {
      setCommentActionError(err.message || "Could not delete comment");
    } finally {
      setCommentBusyId(null);
    }
  };

  if (!isOpen || !movie || !Number.isFinite(movieId)) return null;

  const posterUrl = (() => {
    const p =
      details?.poster_path ||
      movie.poster_path ||
      (movie.posterPath
        ? movie.posterPath.startsWith("http")
          ? movie.posterPath
          : `${POSTER_BASE}${movie.posterPath}`
        : null);
    if (!p) return null;
    if (p.startsWith("http")) return p;
    return `${POSTER_BASE}${p}`;
  })();

  const title = details?.title || movie.title || "Untitled";
  const year = (details?.release_date || movie.release_date || movie.releaseDate || "")
    .toString()
    .slice(0, 4);
  const overview =
    details?.overview ||
    movie.overview ||
    (details?.notFound
      ? "No synopsis is available for this title."
      : "No description available.");

  return (
    <div
      className="movie-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-modal-title"
      >
        <button
          type="button"
          className="movie-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="movie-modal-layout">
          <div className="movie-modal-poster-wrap">
            {posterUrl ? (
              <img src={posterUrl} alt="" className="movie-modal-poster" />
            ) : (
              <div className="movie-modal-poster-placeholder">No poster</div>
            )}
          </div>

          <div className="movie-modal-body">
            <h2 id="movie-modal-title" className="movie-modal-title">
              {title}
            </h2>
            {year && <p className="movie-modal-year">{year}</p>}
            {details?.runtime != null && details.runtime > 0 && (
              <p className="movie-modal-meta">{details.runtime} min</p>
            )}
            {detailsError && (
              <p className="movie-modal-details-warning" role="status">
                {detailsError}
              </p>
            )}
            <section className="movie-modal-section">
              <h3>Description</h3>
              <p className="movie-modal-overview">{overview}</p>
            </section>

            <section className="movie-modal-section movie-modal-comments">
              <h3>Comments</h3>
              {commentsLoading ? (
                <p className="movie-modal-comments-status">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="movie-modal-comments-empty">No comments yet.</p>
              ) : (
                <ul className="movie-modal-comment-list">
                  {comments.map((c) => (
                    <li key={c._id} className="movie-modal-comment">
                      <div className="movie-modal-comment-header">
                        <strong>{c.username}</strong>
                        <span className="movie-modal-comment-meta">
                          <time dateTime={c.createdAt}>
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleString()
                              : ""}
                          </time>
                          {c.updatedAt &&
                            new Date(c.updatedAt).getTime() !==
                              new Date(c.createdAt).getTime() && (
                              <span className="movie-modal-comment-edited">
                                {" "}
                                (edited)
                              </span>
                            )}
                        </span>
                      </div>
                      {editingId === c._id ? (
                        <form
                          className="movie-modal-comment-edit-form"
                          onSubmit={handleSaveEdit}
                        >
                          <textarea
                            rows={3}
                            maxLength={2000}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            aria-label="Edit comment"
                          />
                          <div className="movie-modal-comment-edit-actions">
                            <button
                              type="submit"
                              className="movie-modal-comment-save"
                              disabled={
                                commentBusyId === c._id || !editText.trim()
                              }
                            >
                              {commentBusyId === c._id ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="movie-modal-comment-cancel"
                              disabled={commentBusyId === c._id}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="movie-modal-comment-text">{c.text}</p>
                      )}
                      {isOwnComment(c) && editingId !== c._id && (
                        <div className="movie-modal-comment-actions">
                          <button
                            type="button"
                            className="movie-modal-comment-edit-btn"
                            disabled={commentBusyId != null}
                            onClick={() => startEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="movie-modal-comment-delete-btn"
                            disabled={commentBusyId != null}
                            onClick={() => handleDeleteComment(c._id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {commentActionError && (
                <p className="movie-modal-post-error" role="alert">
                  {commentActionError}
                </p>
              )}

              {isLoggedIn ? (
                <form className="movie-modal-comment-form" onSubmit={handlePostComment}>
                  <label htmlFor="movie-modal-comment-input">Add a comment</label>
                  <textarea
                    id="movie-modal-comment-input"
                    rows={3}
                    maxLength={2000}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts…"
                  />
                  {postError && (
                    <p className="movie-modal-post-error" role="alert">
                      {postError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="movie-modal-submit-comment"
                    disabled={posting || !commentText.trim()}
                  >
                    {posting ? "Posting…" : "Post comment"}
                  </button>
                </form>
              ) : (
                <p className="movie-modal-guest-hint">
                  <Link to="/login">Log in</Link> to join the conversation.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
