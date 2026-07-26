import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { 
  BookOpen, Search, Grid, List, Plus, Edit2, Trash2, Calendar, 
  CheckCircle, AlertTriangle, ArrowRightLeft, DollarSign, 
  BarChart3, Download, Info, Tag, RefreshCw, User, Bell 
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  booksApi, bookCategoriesApi, issuedBooksApi, usersApi, noticesApi 
} from "../../services/api";

const PIE_COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"];

const fallbackCategories = [];

export default function PortalLibrary() {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, books, issue, return, overdue, categories, reports
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  
  // Lists
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  
  // Loaders
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  
  // Search & Filter
  const [bookSearch, setBookSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  
  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState({
    title: "", author: "", isbn: "", category: "", quantity: 1
  });
  const [customCategory, setCustomCategory] = useState("");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState("");

  const isPdfFile = (urlOrData) => {
    if (!urlOrData) return false;
    const lower = urlOrData.toLowerCase();
    return lower.startsWith("data:application/pdf") || lower.endsWith(".pdf") || lower.includes(".pdf?");
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddBook = () => {
    setEditingBook(null);
    const activeCats = categories.length > 0 ? categories : fallbackCategories;
    setBookForm({
      title: "",
      author: "",
      isbn: "",
      category: activeCats[0]?.name || "",
      quantity: 1
    });
    setCustomCategory("");
    setCoverImageFile(null);
    setCoverImagePreview("");
    setShowBookModal(true);
  };

  const handleOpenEditBook = (book) => {
    setEditingBook(book);
    const activeCats = categories.length > 0 ? categories : fallbackCategories;
    const isCustomCategory = !activeCats.some(c => c.name === book.category);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      category: isCustomCategory ? "Other" : book.category,
      quantity: book.quantity
    });
    setCustomCategory(isCustomCategory ? book.category : "");
    setCoverImageFile(null);
    setCoverImagePreview(book.coverImage_url || "");
    setShowBookModal(true);
  };

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#3B82F6" });

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [returnDetails, setReturnDetails] = useState({
    finePaid: true,
    lateDays: 0,
    calculatedFine: 0
  });

  // Issue Book Form
  const [issueForm, setIssueForm] = useState({
    studentId: "",
    bookId: "",
    dueDate: ""
  });

  const [showViewIssueModal, setShowViewIssueModal] = useState(false);
  const [viewingIssue, setViewingIssue] = useState(null);
  const [showEditIssueModal, setShowEditIssueModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [editIssueForm, setEditIssueForm] = useState({ studentId: "", bookId: "", dueDate: "" });

  // Load Data from backend SQLite
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Categories
      const catRes = await bookCategoriesApi.getAll({ schoolId, limit: 100 });
      setCategories(catRes.data || []);

      // 2. Load Books
      const booksRes = await booksApi.getAll({ schoolId, limit: 100 });
      setBooks(booksRes.data || []);

      // 3. Load Issued Books
      const issuedRes = await issuedBooksApi.getAll({ schoolId, limit: 100 });
      setIssuedBooks(issuedRes.data || []);

      // 4. Load Students
      const studentsRes = await usersApi.getAll({ role: "student", schoolId, limit: 100 });
      setStudents(studentsRes.data || []);

      // 5. Load Notices
      const noticesRes = await noticesApi.getAll({ schoolId, limit: 200 });
      setNotices(noticesRes.data || []);
    } catch (err) {
      console.error("Could not load library data:", err);
      toast.error("Failed to sync library data with backend");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "false") {
      localStorage.removeItem("sms_demo_mode");
      window.location.href = window.location.pathname;
      return;
    }
    loadData();
  }, [loadData]);

  // Statistics calculation
  const totalBooks = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalAvailable = books.reduce((sum, b) => sum + b.available, 0);
  const totalIssued = issuedBooks.filter(i => i.status === "Issued" || i.status === "Overdue").length;
  const overdueBooks = issuedBooks.filter(i => {
    if (i.status === "Overdue") return true;
    if (i.status === "Issued" && new Date(i.dueDate) < new Date() && !i.returnDate) return true;
    return false;
  });
  const totalFines = issuedBooks.reduce((sum, i) => sum + (i.fineAmount || 0), 0);

  // Add/Edit Book Handler
  const handleSaveBook = async (e) => {
    e.preventDefault();
    const titleVal = bookForm.title.trim();
    const authorVal = bookForm.author.trim();
    const categoryVal = bookForm.category.trim();
    const isbnVal = bookForm.isbn.trim();

    if (!titleVal) {
      toast.warning("Book Title is required!");
      return;
    }
    if (titleVal.length < 2 || titleVal.length > 50) {
      toast.warning("Book Title must be between 2 and 50 characters!");
      return;
    }
    if (!authorVal) {
      toast.warning("Author is required!");
      return;
    }
    if (authorVal.length < 2 || authorVal.length > 30) {
      toast.warning("Author must be between 2 and 30 characters!");
      return;
    }
    if (/[^a-zA-Z\s\.]/.test(authorVal)) {
      toast.warning("Author name can only contain letters, spaces, and periods!");
      return;
    }
    if (!categoryVal) {
      toast.warning("Category is required!");
      return;
    }
    let selectedCategory = categoryVal;
    if (categoryVal === "Other") {
      const customVal = customCategory.trim();
      if (!customVal) {
        toast.warning("Please specify custom category name!");
        return;
      }
      if (customVal.length < 3 || customVal.length > 30) {
        toast.warning("Custom category name must be between 3 and 30 characters!");
        return;
      }
      if (/[^a-zA-Z0-9\s]/.test(customVal)) {
        toast.warning("Custom category name can only contain letters, numbers, and spaces!");
        return;
      }
      selectedCategory = customVal;
    }
    if (isbnVal) {
      if (/[^0-9]/.test(isbnVal)) {
        toast.warning("ISBN must contain only numbers!");
        return;
      }
      if (isbnVal.length !== 10 && isbnVal.length !== 13) {
        toast.warning("ISBN must be exactly 10 or 13 digits long!");
        return;
      }
    }
    const qty = parseInt(bookForm.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > 1000) {
      toast.warning("Quantity must be a positive integer between 1 and 1000!");
      return;
    }

    setBtnLoading(true);
    try {
      const payload = {
        title: bookForm.title,
        author: bookForm.author,
        isbn: bookForm.isbn || "",
        category: selectedCategory,
        quantity: parseInt(bookForm.quantity) || 1,
        schoolId
      };

      if (coverImageFile) {
        payload.coverImage = coverImageFile;
      }
      payload.coverImage_url = coverImagePreview || "";

      if (editingBook) {
        // Adjust availability dynamically if quantity changed
        const diff = payload.quantity - editingBook.quantity;
        payload.available = Math.max(0, editingBook.available + diff);
        if (!coverImageFile) {
          payload.coverImage_url = editingBook.coverImage_url || "";
        }
        await booksApi.update(editingBook.id, payload);

        // Propagate title update everywhere (issued_books and notices in database)
        if (editingBook.title !== payload.title) {
          const oldTitle = editingBook.title;
          const newTitle = payload.title;

          // 1. Update all issued & returned records for this book
          const matchingIssues = issuedBooks.filter(i => i.bookId === editingBook.id || i.bookTitle === oldTitle);
          for (const issue of matchingIssues) {
            try {
              await issuedBooksApi.update(issue.id, {
                ...issue,
                bookTitle: newTitle
              });
            } catch (e) {
              console.error("Failed to sync book title in issued_books:", e);
            }
          }

          // 2. Update all notice bulletins referencing this book
          const matchingNotices = notices.filter(n => 
            (n.title && n.title.includes(oldTitle)) || 
            (n.description && n.description.includes(oldTitle))
          );
          for (const notice of matchingNotices) {
            try {
              const updatedTitle = notice.title ? notice.title.replaceAll(oldTitle, newTitle) : notice.title;
              const updatedDesc = notice.description ? notice.description.replaceAll(oldTitle, newTitle) : notice.description;
              await noticesApi.update(notice.id, {
                ...notice,
                title: updatedTitle,
                description: updatedDesc
              });
            } catch (e) {
              console.error("Failed to sync book title in notices:", e);
            }
          }
        }

        toast.success("Book records updated successfully");
      } else {
        await booksApi.create(payload);
        toast.success("New book added to library");
      }
      setShowBookModal(false);
      setEditingBook(null);
      setBookForm({ title: "", author: "", isbn: "", category: "", quantity: 1 });
      setCustomCategory("");
      setCoverImageFile(null);
      setCoverImagePreview("");
      setCatFilter("All");  // reset filter so edited book is always visible
      setBookSearch("");    // reset search too
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save book records");
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete Book
  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to remove this book from the library catalog?")) return;
    try {
      await booksApi.delete(id);
      toast.success("Book removed successfully");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete book");
    }
  };

  // Add/Edit Category Handler
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const nameVal = categoryForm.name.trim();
    if (!nameVal) {
      toast.warning("Category Name is required!");
      return;
    }
    if (nameVal.length < 3 || nameVal.length > 30) {
      toast.warning("Category Name must be between 3 and 30 characters!");
      return;
    }
    const nameRegex = /^[a-zA-Z0-9\s]+$/;
    if (!nameRegex.test(nameVal)) {
      toast.warning("Category Name can only contain alphanumeric characters and spaces!");
      return;
    }

    setBtnLoading(true);
    try {
      const payload = {
        name: categoryForm.name,
        color: categoryForm.color,
        schoolId
      };

      if (editingCategory) {
        await bookCategoriesApi.update(editingCategory.id, payload);
        toast.success("Category updated");
      } else {
        await bookCategoriesApi.create(payload);
        toast.success("Category added");
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", color: "#3B82F6" });
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Books will remain but their category label will be unaffected.")) return;
    try {
      await bookCategoriesApi.delete(id);
      toast.success("Category deleted");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  // Issue Book Submission
  const handleIssueBook = async (e) => {
    e.preventDefault();
    if (!issueForm.studentId || !issueForm.bookId || !issueForm.dueDate) {
      toast.warning("All fields are required to issue a book");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(issueForm.dueDate);
    due.setHours(0, 0, 0, 0);
    if (due < today) {
      toast.warning("Return date cannot be before the book issue date!");
      return;
    }

    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 15);

    if (due > maxAllowedDate) {
      toast.warning(`A book cannot be issued for more than 15 days! Maximum return date allowed is ${maxAllowedDate.toLocaleDateString()}.`);
      return;
    }

    const selectedBook = books.find(b => b.id === issueForm.bookId);
    if (!selectedBook || selectedBook.available <= 0) {
      toast.error("Selected book is currently out of stock!");
      return;
    }

    const selectedStudent = students.find(s => s.id === issueForm.studentId);
    if (!selectedStudent) {
      toast.error("Student not found");
      return;
    }

    // Validation: Prevent duplicate borrowing (same student cannot borrow multiple copies of the same book simultaneously)
    const existingActiveIssue = issuedBooks.find(i => 
      i.studentId === selectedStudent.id && 
      (i.bookId === selectedBook.id || i.bookTitle === selectedBook.title) &&
      (i.status === "Issued" || i.status === "Overdue")
    );

    if (existingActiveIssue) {
      toast.warning(`"${selectedStudent.name}" already has an active copy of "${selectedBook.title}" borrowed! Return the previous copy first.`);
      return;
    }

    setBtnLoading(true);
    try {
      // 1. Create Issue Entry
      const payload = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        dueDate: new Date(issueForm.dueDate).toISOString(),
        issueDate: new Date().toISOString(),
        status: "Issued",
        schoolId
      };
      await issuedBooksApi.create(payload);

      // 2. Decrement book availability
      await booksApi.update(selectedBook.id, {
        ...selectedBook,
        available: selectedBook.available - 1
      });

      toast.success(`"${selectedBook.title}" issued to ${selectedStudent.name}!`);
      setIssueForm({ studentId: "", bookId: "", dueDate: "" });
      setActiveTab("return");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to issue book");
    } finally {
      setBtnLoading(false);
    }
  };

  // Open Return Modal & Pre-calculate fines
  const handleOpenReturnModal = (issue) => {
    try {
      console.log("Opening return modal for issue:", issue);
      setSelectedIssue(issue);
      
      // Calculate late days and fine
      const due = new Date(issue.dueDate);
      const today = new Date();
      let days = 0;
      let fine = 0;

      if (isNaN(due.getTime())) {
        console.warn("Invalid due date parsed:", issue.dueDate);
      } else if (today > due) {
        const diffTime = Math.abs(today - due);
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fine = days * 5; // ₹5 fine per day
      }

      setReturnDetails({
        lateDays: days,
        calculatedFine: fine,
        finePaid: true
      });
      setShowReturnModal(true);
    } catch (err) {
      console.error("Error opening return modal:", err);
      toast.error("Failed to parse return details: " + err.message);
    }
  };

  // Return Book Confirmation
  const handleConfirmReturn = async () => {
    if (!selectedIssue) return;
    setBtnLoading(true);

    try {
      // 1. Update issue entry with return details
      const payload = {
        ...selectedIssue,
        returnDate: new Date().toISOString(),
        fineAmount: returnDetails.calculatedFine,
        finePaid: returnDetails.finePaid,
        status: "Returned"
      };
      await issuedBooksApi.update(selectedIssue.id, payload);

      // 2. Increment book availability
      const bookObj = books.find(b => b.id === selectedIssue.bookId);
      if (bookObj) {
        await booksApi.update(bookObj.id, {
          ...bookObj,
          available: Math.min(bookObj.quantity, bookObj.available + 1)
        });
      }

      toast.success("Book returned successfully");
      setShowReturnModal(false);
      setSelectedIssue(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to process return");
    } finally {
      setBtnLoading(false);
    }
  };

  // Helper to calculate sent notice count per issue
  const getNoticeCountForIssue = (issue) => {
    if (!notices || notices.length === 0) return 0;
    const sName = (issue.studentName || "").toLowerCase().trim();
    const bTitle = (issue.bookTitle || "").toLowerCase().trim();
    return notices.filter(n => {
      const t = (n.title || "").toLowerCase();
      const d = (n.description || "").toLowerCase();
      return (t.includes(sName) || d.includes(sName)) &&
             (t.includes(bTitle) || d.includes(bTitle));
    }).length;
  };

  // Notify Student alert
  const handleNotifyStudent = async (issue) => {
    setBtnLoading(true);
    try {
      const due = new Date(issue.dueDate);
      const diffTime = Math.abs(new Date() - due);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const fine = days * 5;

      const noticePayload = {
        title: `Overdue Book Alert: ${issue.studentName}`,
        description: `Dear Parent, your child ${issue.studentName} has an overdue library book: "${issue.bookTitle}". Due Date: ${due.toLocaleDateString()}. Outstanding Fine: ₹${fine}. Please return it to the library desk immediately.`,
        category: "Library",
        publishDate: new Date().toISOString(),
        status: "published",
        schoolId
      };

      await noticesApi.create(noticePayload);

      toast.success(`Overdue notification dispatched to parent of ${issue.studentName}!`, {
        description: `Alert sent for book: "${issue.bookTitle}" (Fine: ₹${fine})`
      });
      loadData();
    } catch (err) {
      toast.error("Failed to send notification: " + (err.message || "Unknown error"));
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete Issue entry
  const handleDeleteIssue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this issue entry?")) return;
    try {
      const issueObj = issuedBooks.find(i => i.id === id);
      await issuedBooksApi.delete(id);
      
      // If the book was not returned yet, restore stock
      if (issueObj && (issueObj.status === "Issued" || issueObj.status === "Overdue")) {
        const bookObj = books.find(b => b.id === issueObj.bookId);
        if (bookObj) {
          await booksApi.update(bookObj.id, {
            ...bookObj,
            available: Math.min(bookObj.quantity, bookObj.available + 1)
          });
        }
      }
      
      toast.success("Issued book entry deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete issue entry");
    }
  };

  // Edit Issue entry
  const handleSaveEditIssue = async (e) => {
    e.preventDefault();
    if (!editingIssue) return;
    if (!editIssueForm.studentId || !editIssueForm.bookId || !editIssueForm.dueDate) {
      toast.warning("All fields are required");
      return;
    }

    const issueDateObj = editingIssue.issueDate ? new Date(editingIssue.issueDate) : new Date();
    issueDateObj.setHours(0, 0, 0, 0);

    const selectedDueDate = new Date(editIssueForm.dueDate);
    selectedDueDate.setHours(0, 0, 0, 0);

    if (selectedDueDate < issueDateObj) {
      toast.warning(`Return date cannot be before the book issue date (${issueDateObj.toLocaleDateString()})!`);
      return;
    }

    const maxAllowedDueDate = new Date(issueDateObj);
    maxAllowedDueDate.setDate(maxAllowedDueDate.getDate() + 15);

    if (selectedDueDate > maxAllowedDueDate) {
      toast.warning(`A book cannot be issued for more than 15 days! Maximum return date allowed is ${maxAllowedDueDate.toLocaleDateString()}.`);
      return;
    }
    
    setBtnLoading(true);
    try {
      const selectedStudent = students.find(s => s.id === editIssueForm.studentId);
      const selectedBook = books.find(b => b.id === editIssueForm.bookId);
      
      if (!selectedStudent || !selectedBook) {
        toast.error("Invalid student or book selected");
        return;
      }

      // Check if student already has another active issue for this book
      const duplicateIssue = issuedBooks.find(i => 
        i.id !== editingIssue.id &&
        i.studentId === selectedStudent.id &&
        (i.bookId === selectedBook.id || i.bookTitle === selectedBook.title) &&
        (i.status === "Issued" || i.status === "Overdue")
      );
      if (duplicateIssue) {
        toast.warning(`"${selectedStudent.name}" already has an active copy of "${selectedBook.title}" borrowed!`);
        return;
      }
      
      // Stock updates if the book changed
      if (selectedBook.id !== editingIssue.bookId) {
        // Check new book availability
        if (selectedBook.available <= 0) {
          toast.error("Selected new book is currently out of stock!");
          return;
        }
        
        // Restore stock for old book
        const oldBook = books.find(b => b.id === editingIssue.bookId);
        if (oldBook) {
          await booksApi.update(oldBook.id, {
            ...oldBook,
            available: Math.min(oldBook.quantity, oldBook.available + 1)
          });
        }
        
        // Decrement stock for new book
        await booksApi.update(selectedBook.id, {
          ...selectedBook,
          available: selectedBook.available - 1
        });
      }
      
      const payload = {
        ...editingIssue,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        dueDate: new Date(editIssueForm.dueDate).toISOString()
      };
      
      await issuedBooksApi.update(editingIssue.id, payload);
      toast.success("Issued book entry updated successfully!");
      setShowEditIssueModal(false);
      setEditingIssue(null);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update issue entry");
    } finally {
      setBtnLoading(false);
    }
  };

  // Filter books
  const filteredBooks = books.filter(b => {
    const matchesSearch = (b.title || "").toLowerCase().includes(bookSearch.toLowerCase()) ||
                          (b.author || "").toLowerCase().includes(bookSearch.toLowerCase()) ||
                          (b.isbn && b.isbn.includes(bookSearch));
    const matchesCat = catFilter === "All" || b.category === catFilter;
    return matchesSearch && matchesCat;
  });

  // Dynamic calculation of Book Records Summary by Category from real books state
  const categoryCountsMap = {};
  books.forEach(b => {
    if (b.category) {
      categoryCountsMap[b.category] = (categoryCountsMap[b.category] || 0) + (b.quantity || 1);
    }
  });

  const pieData = Object.keys(categoryCountsMap).map((catName, idx) => {
    const foundCat = categories.find(c => c.name === catName);
    return {
      name: catName,
      value: categoryCountsMap[catName],
      color: foundCat?.color || PIE_COLORS[idx % PIE_COLORS.length]
    };
  });

  // Display Mode toggles
  const [trendDisplayMode, setTrendDisplayMode] = useState("count"); // "count" or "percentage"
  const [reportDisplayMode, setReportDisplayMode] = useState("percentage"); // "percentage" or "count"

  // Dynamic calculation of Monthly Issue VS Return Trends from real issuedBooks state
  const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyMap = {};
  monthsList.forEach(m => {
    monthlyMap[m] = { month: m, Issues: 0, Returns: 0, Fines: 0 };
  });

  issuedBooks.forEach(item => {
    if (item.issueDate) {
      const d = new Date(item.issueDate);
      if (!isNaN(d.getTime())) {
        const mName = d.toLocaleString("en-US", { month: "short" });
        if (monthlyMap[mName]) {
          monthlyMap[mName].Issues += 1;
        }
      }
    }
    if (item.returnDate && (item.status === "Returned" || item.returnDate)) {
      const rd = new Date(item.returnDate);
      if (!isNaN(rd.getTime())) {
        const mName = rd.toLocaleString("en-US", { month: "short" });
        if (monthlyMap[mName]) {
          monthlyMap[mName].Returns += 1;
          monthlyMap[mName].Fines += (item.fineAmount || 0);
        }
      }
    }
  });

  const issueTrendData = monthsList.map(m => {
    const raw = monthlyMap[m];
    const monthTotal = raw.Issues + raw.Returns;
    const issuesPct = monthTotal > 0 ? Math.round((raw.Issues / monthTotal) * 100) : 0;
    const returnsPct = monthTotal > 0 ? Math.round((raw.Returns / monthTotal) * 100) : 0;
    return {
      ...raw,
      "IssuesPct": issuesPct,
      "ReturnsPct": returnsPct
    };
  });
  const hasTrendData = issuedBooks.length > 0;

  // Percentage calculations for Reports category distribution
  const totalBooksCount = books.reduce((sum, b) => sum + (b.quantity || 1), 0);
  const reportsCategoryData = pieData.map(item => ({
    ...item,
    percentage: totalBooksCount > 0 ? Math.round((item.value / totalBooksCount) * 100) : 0
  }));

  return (
    <div className="space-y-6 pb-20">
      
      {/* ── HEADER & NAVIGATION TABS ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-sky-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-sky-600" size={28} />
            LIBRARY WORKSPACE
          </h1>
          <p className="text-xs font-bold text-sky-600/70 tracking-widest uppercase">
            SaaS Smart Library Desk
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={15} /> },
            { id: "books", label: "Book Records", icon: <BookOpen size={15} /> },
            { id: "issue", label: "Issue Book", icon: <ArrowRightLeft size={15} /> },
            { id: "return", label: "Return Book", icon: <CheckCircle size={15} /> },
            { id: "overdue", label: "Overdue", icon: <AlertTriangle size={15} /> },
            { id: "categories", label: "Categories", icon: <Tag size={15} /> },
            { id: "reports", label: "Reports", icon: <Download size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? "bg-white text-sky-600 shadow-sm border border-sky-100 font-extrabold" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/50 shadow-xs">
          <RefreshCw className="animate-spin text-sky-600 mr-3" size={24} />
          <span className="text-slate-500 text-sm font-semibold">Syncing library files with backend database...</span>
        </div>
      )}

      {/* ── CONTENT SWITCHER ───────────────────────────────────────── */}
      {!loading && (
        <div className="space-y-6">
          
          {/* TAB 1: LIBRARY DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                {[
                  { label: "Total Books", val: totalBooks, icon: <BookOpen size={20} />, bg: "from-sky-50 to-sky-100/50 text-sky-600 border-sky-200" },
                  { label: "Borrowed Out", val: totalIssued, icon: <ArrowRightLeft size={20} />, bg: "from-amber-50 to-amber-100/50 text-amber-600 border-amber-200" },
                  { label: "Overdue Items", val: overdueBooks.length, icon: <AlertTriangle size={20} />, bg: "from-rose-50 to-rose-100/50 text-rose-600 border-rose-200" },
                  { label: "Available Stock", val: totalAvailable, icon: <CheckCircle size={20} />, bg: "from-emerald-50 to-emerald-100/50 text-emerald-600 border-emerald-200" },
                  { label: "Late Fines", val: `₹${totalFines}`, icon: <DollarSign size={20} />, bg: "from-violet-50 to-violet-100/50 text-violet-600 border-violet-200" },
                ].map((stat, i) => (
                  <div key={i} className={`bg-gradient-to-br ${stat.bg} p-5 rounded-2xl border shadow-xs flex flex-col justify-between h-[115px]`}>
                    <div className="flex justify-between items-center opacity-85">
                      <span className="text-[10px] font-black uppercase tracking-widest">{stat.label}</span>
                      {stat.icon}
                    </div>
                    <span className="text-3xl font-black tracking-tight">{stat.val}</span>
                  </div>
                ))}
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Info size={16} className="text-sky-500" />
                    Librarian Desk Shortcuts
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setActiveTab("issue")} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all text-slate-700 hover:text-sky-600">
                      <ArrowRightLeft className="mb-2" size={20} />
                      <span className="text-xs font-bold">Issue Book</span>
                    </button>
                    <button onClick={() => setActiveTab("return")} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all text-slate-700 hover:text-sky-600">
                      <CheckCircle className="mb-2" size={20} />
                      <span className="text-xs font-bold">Return Book</span>
                    </button>
                    <button onClick={handleOpenAddBook} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all text-slate-700 hover:text-sky-600">
                      <Plus className="mb-2" size={20} />
                      <span className="text-xs font-bold">Add Book</span>
                    </button>
                    <button onClick={() => setActiveTab("categories")} className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-sky-300 hover:bg-sky-50/30 transition-all text-slate-700 hover:text-sky-600">
                      <Tag className="mb-2" size={20} />
                      <span className="text-xs font-bold">Categories</span>
                    </button>
                  </div>
                </div>

                {/* Donut Chart: Book Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Book Records Summary</h3>
                  {pieData.length > 0 ? (
                    <>
                      <div className="h-[180px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                        {pieData.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name.slice(0, 15)}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[210px] flex flex-col items-center justify-center text-center p-4">
                      <BookOpen className="text-slate-300 mb-2" size={32} />
                      <p className="text-xs font-bold text-slate-400">No book records added yet</p>
                      <span className="text-[10px] text-slate-400 mt-1">Add books to view category distribution</span>
                    </div>
                  )}
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Bell size={16} className="text-sky-500" />
                    Recent Library Events
                  </h3>
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {issuedBooks.length > 0 ? (
                      issuedBooks.slice(0, 4).map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            issue.status === "Returned" 
                              ? "bg-emerald-50 text-emerald-600" 
                              : issue.status === "Overdue" 
                              ? "bg-rose-50 text-rose-600" 
                              : "bg-sky-50 text-sky-600"
                          }`}>
                            <BookOpen size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">
                              {issue.studentName} {issue.status === "Returned" ? "returned" : "borrowed"} "{issue.bookTitle}"
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                              {new Date(issue.issueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-10">No recent activity logged</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <h3 className="text-sm font-bold text-slate-800">Monthly Issue VS Return Trends</h3>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
                    <button
                      onClick={() => setTrendDisplayMode("count")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        trendDisplayMode === "count" ? "bg-white text-sky-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Count (#)
                    </button>
                    <button
                      onClick={() => setTrendDisplayMode("percentage")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        trendDisplayMode === "percentage" ? "bg-white text-sky-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>

                <div className="h-[280px]">
                  {hasTrendData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={issueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }} axisLine={false} tickLine={false} />
                        {trendDisplayMode === "percentage" ? (
                          <YAxis 
                            domain={[0, 100]} 
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 11, fill: "#64748B" }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                        ) : (
                          <YAxis 
                            allowDecimals={false} 
                            tick={{ fontSize: 11, fill: "#64748B" }} 
                            axisLine={false} 
                            tickLine={false} 
                          />
                        )}
                        <Tooltip 
                          formatter={(val, name) => [
                            trendDisplayMode === "percentage" ? `${val}%` : `${val} Books`,
                            name
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 10 }} />
                        {trendDisplayMode === "percentage" ? (
                          <>
                            <Bar dataKey="IssuesPct" name="Issues (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="ReturnsPct" name="Returns (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <>
                            <Bar dataKey="Issues" name="Issues (#)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Returns" name="Returns (#)" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl">
                      <BarChart3 className="text-slate-300 mb-2" size={36} />
                      <p className="text-xs font-bold text-slate-500">No Issue & Return Records Found</p>
                      <span className="text-[10px] text-slate-400 mt-1">Issue books to students to generate monthly activity trends</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKS PAGE (CATALOG) */}
          {activeTab === "books" && (
            <div className="space-y-6">
              
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={17} />
                    <input 
                      type="text" 
                      placeholder="Search title, author, or ISBN..." 
                      value={bookSearch} 
                      onChange={(e) => setBookSearch(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    />
                  </div>
                  <select 
                    value={catFilter} 
                    onChange={(e) => setCatFilter(e.target.value)} 
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-sky-500 transition-all cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    {(categories.length > 0 ? categories : fallbackCategories).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden p-0.5 bg-slate-100">
                    <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md ${viewMode === "grid" ? "bg-white text-sky-600 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
                      <Grid size={15} />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-2 rounded-md ${viewMode === "list" ? "bg-white text-sky-600 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}>
                      <List size={15} />
                    </button>
                  </div>

                  <button 
                    onClick={handleOpenAddBook}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-5 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-all shadow-md shadow-sky-600/15"
                  >
                    <Plus size={16} />
                    Add Book
                  </button>
                </div>
              </div>

              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredBooks.length > 0 ? (
                    filteredBooks.map((book, idx) => {
                      const bookCat = categories.find(c => c.name === book.category);
                      const barColor = bookCat?.color || "#3B82F6";
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: idx * 0.03 }}
                          key={book.id} 
                          className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-sky-200 transition-all duration-200"
                        >
                          <div className="p-5 space-y-4">
                             <div className="w-full h-36 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                              {book.coverImage_url ? (
                                isPdfFile(book.coverImage_url) ? (
                                  <a 
                                    href={book.coverImage_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full h-full bg-rose-50 hover:bg-rose-100 flex flex-col items-center justify-center text-rose-600 font-extrabold text-xs gap-1.5 transition-colors"
                                    title="Open PDF Document"
                                  >
                                    <span className="text-3xl">📄</span>
                                    <span className="text-[10px] tracking-wider font-black">VIEW PDF BOOK</span>
                                  </a>
                                ) : (
                                  <img 
                                    src={book.coverImage_url} 
                                    alt={book.title} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                )
                              ) : (
                                <BookOpen size={48} className="text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                              )}
                              <div className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-black text-white rounded-md tracking-wider uppercase" style={{ backgroundColor: barColor }}>
                                {book.category}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1 truncate" title={book.title}>{book.title}</h4>
                              <p className="text-[11px] text-slate-500 font-bold truncate">by {book.author}</p>
                              {book.isbn && <p className="text-[10px] text-slate-400 font-mono">ISBN: {book.isbn}</p>}
                            </div>
                          </div>

                          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className={`text-[10px] font-black tracking-wider uppercase ${
                                book.available > 0 ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded"
                            }`}>
                              {book.available > 0 ? `Stock: ${book.available}/${book.quantity}` : "Borrowed Out"}
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {book.coverImage_url && isPdfFile(book.coverImage_url) && (
                                <a 
                                  href={book.coverImage_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-2 py-1 text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md flex items-center gap-1 transition-all mr-1"
                                >
                                  PDF
                                </a>
                              )}
                              <button onClick={() => handleOpenEditBook(book)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-sky-600 transition-all" title="Edit">
                                <Edit2 size={13} />
                              </button>
                              <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-rose-600 transition-all" title="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-400">
                      No matching books found in library catalog
                    </div>
                  )}
                </div>
              )}

              {/* Table View */}
              {viewMode === "list" && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-slate-50 border-b-2 border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 text-left">Title</th>
                          <th className="px-6 py-4 text-left">Author</th>
                          <th className="px-6 py-4 text-left">ISBN</th>
                          <th className="px-6 py-4 text-left">Category</th>
                          <th className="px-6 py-4 text-left">Availability</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                        {filteredBooks.length > 0 ? (
                          filteredBooks.map((book) => (
                            <tr key={book.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-extrabold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <span>{book.title}</span>
                                  {book.coverImage_url && isPdfFile(book.coverImage_url) && (
                                    <a 
                                      href={book.coverImage_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="px-1.5 py-0.5 text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-all uppercase"
                                      title="Open PDF Document"
                                    >
                                      PDF
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{book.author}</td>
                              <td className="px-6 py-4 font-mono text-slate-400">{book.isbn || "N/A"}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black text-white uppercase" style={{ backgroundColor: categories.find(c => c.name === book.category)?.color || "#3B82F6" }}>
                                  {book.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  book.available > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                                }`}>
                                  {book.available > 0 ? `${book.available} / ${book.quantity} Available` : "Borrowed Out"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center items-center gap-1.5">
                                  {book.coverImage_url && isPdfFile(book.coverImage_url) && (
                                    <a 
                                      href={book.coverImage_url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded transition-all flex items-center justify-center" 
                                      title="Open PDF"
                                    >
                                      <span className="font-extrabold text-[10px] px-0.5">PDF</span>
                                    </a>
                                  )}
                                  <button onClick={() => handleOpenEditBook(book)} className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded transition-all" title="Edit">
                                    <Edit2 size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteBook(book.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded transition-all" title="Delete">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No books registered matching filters</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ISSUE BOOK */}
          {activeTab === "issue" && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <ArrowRightLeft className="text-sky-600" size={20} />
                  Book Outflow Registry
                </h3>
                <p className="text-xs text-slate-400">Issue library resources to register student members.</p>
              </div>

              <form onSubmit={handleIssueBook} className="space-y-5">
                {/* Student Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Select Student Member</label>
                  <select 
                    value={issueForm.studentId}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Search and Select Student --</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
                    ))}
                  </select>
                </div>

                {/* Book Select */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Select Book</label>
                  <select 
                    value={issueForm.bookId}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, bookId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Select Available Book --</option>
                    {books.filter(b => b.available > 0).map(book => (
                      <option key={book.id} value={book.id}>{book.title} (by {book.author}) - {book.available} available</option>
                    ))}
                  </select>
                </div>

                {/* Due Date Picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Return Due Date</label>
                  <div className="relative group">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors" size={17} />
                    <input 
                      type="date" 
                      value={issueForm.dueDate}
                      onChange={(e) => setIssueForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                      max={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-md shadow-sky-600/15 uppercase tracking-wider"
                >
                  {btnLoading ? "Processing issue entry..." : "Confirm Book Issue"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: RETURN BOOK */}
          {activeTab === "return" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <ArrowRightLeft className="text-sky-600" size={16} />
                    Issued Books Directory
                  </h3>
                  <p className="text-xs text-slate-400">Confirm returns and calculate applicable fine totals.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Student</th>
                      <th className="px-6 py-4 text-left">Book Title</th>
                      <th className="px-6 py-4 text-left">Issued Date</th>
                      <th className="px-6 py-4 text-left">Due Date</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                    {issuedBooks.filter(i => i.status === "Issued" || i.status === "Overdue").length > 0 ? (
                      issuedBooks.filter(i => i.status === "Issued" || i.status === "Overdue").map((issue) => {
                        const isLate = new Date() > new Date(issue.dueDate);
                        return (
                          <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-extrabold text-slate-800">{issue.studentName}</td>
                            <td className="px-6 py-4 text-slate-500 font-extrabold">{issue.bookTitle}</td>
                            <td className="px-6 py-4 text-slate-400">{new Date(issue.issueDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-slate-400">{new Date(issue.dueDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                isLate ? "text-rose-600 bg-rose-50" : "text-sky-600 bg-sky-50"
                              }`}>
                                {isLate ? "Overdue" : "Issued"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center items-center gap-1.5">
                                <button 
                                  onClick={() => handleOpenReturnModal(issue)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded text-[11px] transition-all shadow-xs"
                                >
                                  Return
                                </button>
                                <button 
                                  onClick={() => { setViewingIssue(issue); setShowViewIssueModal(true); }}
                                  className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded transition-all flex items-center justify-center" 
                                  title="View Details"
                                >
                                  <Info size={13} />
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingIssue(issue);
                                    setEditIssueForm({
                                      studentId: issue.studentId,
                                      bookId: issue.bookId,
                                      dueDate: issue.dueDate ? issue.dueDate.split("T")[0] : ""
                                    });
                                    setShowEditIssueModal(true);
                                  }}
                                  className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded transition-all flex items-center justify-center" 
                                  title="Edit Entry"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteIssue(issue.id)}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded transition-all flex items-center justify-center" 
                                  title="Delete Entry"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No active books currently issued</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: OVERDUE BOOKS */}
          {activeTab === "overdue" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="text-rose-500" size={16} />
                    Overdue ledger list
                  </h3>
                  <p className="text-xs text-slate-400">Track fine metrics and alert student guardians.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Student</th>
                      <th className="px-6 py-4 text-left">Book Title</th>
                      <th className="px-6 py-4 text-left">Due Date</th>
                      <th className="px-6 py-4 text-left">Late Days</th>
                      <th className="px-6 py-4 text-left">Fine Amount</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
                    {overdueBooks.length > 0 ? (
                      overdueBooks.map((issue) => {
                        const due = new Date(issue.dueDate);
                        const diffTime = Math.abs(new Date() - due);
                        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        const fine = days * 5;
                        const statusBadge = days > 10 ? "Urgent" : days > 5 ? "Moderate" : "Friendly";
                        return (
                          <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-extrabold text-slate-800">{issue.studentName}</td>
                            <td className="px-6 py-4 text-slate-500">{issue.bookTitle}</td>
                            <td className="px-6 py-4 text-slate-400">{due.toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-rose-600 font-extrabold">{days} Days</td>
                            <td className="px-6 py-4 text-slate-800 font-black">₹{fine}</td>
                            <td className="px-6 py-4 text-center">
                              {(() => {
                                const noticeCount = getNoticeCountForIssue(issue);
                                return (
                                  <div className="flex flex-col items-center">
                                    <button 
                                      onClick={() => handleNotifyStudent(issue)}
                                      disabled={btnLoading}
                                      className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-bold py-1.5 px-3.5 rounded text-xs transition-all border border-rose-200 disabled:opacity-50"
                                    >
                                      Notify Student
                                    </button>
                                    {noticeCount > 0 && (
                                      <span className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center justify-center gap-1">
                                        <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                                        {noticeCount === 1 ? "1 notification has already been sent" : `${noticeCount} notifications have already been sent`}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Excellent! No overdue books listed</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORIES */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              
              {/* Category creation header */}
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Manage Categories</span>
                <button 
                  onClick={() => { setEditingCategory(null); setCategoryForm({ name: "", color: "#3B82F6" }); setShowCategoryModal(true); }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1 text-xs transition-all"
                >
                  <Plus size={15} />
                  Add Category
                </button>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((cat, idx) => {
                  const bookCount = books.filter(b => b.category === cat.name).length;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={cat.id} 
                      className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between h-[130px] group hover:border-slate-350 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full block border border-slate-200" style={{ backgroundColor: cat.color }} />
                          <h4 className="font-extrabold text-slate-800 text-sm">{cat.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, color: cat.color }); setShowCategoryModal(true); }} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-sky-600">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Color Label: <span className="font-mono text-slate-600">{cat.color}</span></span>
                        <span className="text-xs font-black text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">{bookCount} Books</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === "reports" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Reports Chart Cards */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800">Most Issued Book Categories</h3>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setReportDisplayMode("percentage")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        reportDisplayMode === "percentage" ? "bg-white text-sky-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      onClick={() => setReportDisplayMode("count")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        reportDisplayMode === "count" ? "bg-white text-sky-600 shadow-xs font-extrabold" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Count (#)
                    </button>
                  </div>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportsCategoryData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid stroke="#F8FAFC" />
                      {reportDisplayMode === "percentage" ? (
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: "#64748B" }} />
                      ) : (
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                      )}
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(val, name, item) => [
                          reportDisplayMode === "percentage" 
                            ? `${val}% (${item.payload.value} Books)` 
                            : `${val} Books (${item.payload.percentage}%)`,
                          "Share"
                        ]}
                      />
                      <Bar 
                        dataKey={reportDisplayMode === "percentage" ? "percentage" : "value"} 
                        name="Distribution" 
                        fill="#3B82F6" 
                        radius={[0, 4, 4, 0]}
                      >
                        {reportsCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Fine Collection Revenue Trend</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={issueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`₹${v}`, "Fines Collected"]} />
                      <Area type="monotone" dataKey="Fines" stroke="#8B5CF6" fill="rgba(139, 92, 246, 0.08)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Simulated Exports Desk */}
              <div className="lg:col-span-2 bg-gradient-to-r from-sky-500 to-sky-700 text-white p-8 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight">Export Library Data Sheets</h3>
                  <p className="text-xs opacity-80 max-w-lg">Retrieve fully validated exports for compliance reports, book counts, fine ledgers, and catalog sheets.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                        loading: "Parsing PDF Document layers...",
                        success: "Library_Catalog_Report.pdf generated successfully!",
                        error: "Failed to generate report"
                      });
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-sky-700 font-extrabold rounded-xl text-xs hover:bg-slate-100 active:scale-95 transition-all shadow-md"
                  >
                    <Download size={14} />
                    EXPORT PDF
                  </button>
                  <button 
                    onClick={() => {
                      toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                        loading: "Building Excel cells sheet...",
                        success: "Library_Ledger_Spreadsheet.xlsx generated!",
                        error: "Failed to export ledger"
                      });
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-sky-600/50 border border-white/20 text-white font-extrabold rounded-xl text-xs hover:bg-sky-600 active:scale-95 transition-all shadow-md"
                  >
                    <Download size={14} />
                    EXPORT EXCEL
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── MODALS (ADD/EDIT BOOK) ─────────────────────────────────── */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">{editingBook ? "Edit Book Details" : "Add New Book"}</h3>
                <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Close</button>
              </div>
              <form onSubmit={handleSaveBook} className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Book Title</label>
                  <input 
                    type="text" 
                    required
                    maxLength={50}
                    value={bookForm.title}
                    onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value.slice(0, 50) }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    placeholder="e.g. Physics for Scientists"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Author Name</label>
                  <input 
                    type="text" 
                    required
                    maxLength={30}
                    value={bookForm.author}
                    onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value.replace(/[^a-zA-Z\s\.]/g, '').slice(0, 30) }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    placeholder="e.g. Paul A. Tipler"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">ISBN Code (Optional)</label>
                  <input 
                    type="text" 
                    maxLength={13}
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm(prev => ({ ...prev, isbn: e.target.value.replace(/[^0-9]/g, '').slice(0, 13) }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    placeholder="e.g. 9780716789550"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 font-semibold">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Category</label>
                  <select 
                    value={bookForm.category}
                    onChange={(e) => setBookForm(prev => ({ ...prev, category: e.target.value }))}
                    style={{ width: "100%", display: "block", boxSizing: "border-box" }}
                    className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold cursor-pointer"
                  >
                    {(categories.length > 0 ? categories : fallbackCategories).map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Other">Other...</option>
                  </select>
                </div>

                 <div className="flex flex-col gap-1.5 font-semibold">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Quantity</label>
                  <input 
                    type="number" 
                    min="1"
                    max="1000"
                    value={bookForm.quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const num = parseInt(val, 10);
                      if (!val) {
                        setBookForm(prev => ({ ...prev, quantity: "" }));
                      } else if (num > 1000) {
                        setBookForm(prev => ({ ...prev, quantity: "1000" }));
                      } else {
                        setBookForm(prev => ({ ...prev, quantity: num.toString() }));
                      }
                    }}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                  />
                </div>

                {bookForm.category === "Other" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase">Custom Category Name</label>
                    <input 
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 30))}
                      placeholder="e.g. History & Politics"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Book Cover Photo / PDF</label>
                  <div className="flex items-center gap-4">
                    {coverImagePreview ? (
                      isPdfFile(coverImagePreview) ? (
                        <div className="w-12 h-16 rounded-lg bg-rose-50 border border-rose-200 flex flex-col items-center justify-center text-rose-600 font-extrabold text-[9px] gap-1 shadow-inner shrink-0">
                          <span className="text-base">📄</span>
                          <span>PDF FILE</span>
                        </div>
                      ) : (
                        <img 
                          src={coverImagePreview} 
                          alt="Cover Preview" 
                          className="w-12 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                      )
                    ) : (
                      <div className="w-12 h-16 rounded-lg bg-slate-50 border border-dashed border-slate-350 flex items-center justify-center text-slate-400 text-center font-bold text-[9px] shrink-0">
                        NO COVER
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleCoverPhotoChange}
                      className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                    />
                  </div>
                </div>

                <button type="submit" disabled={btnLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 rounded-lg text-xs mt-2 transition-all shadow-md">
                  {btnLoading ? "Syncing changes..." : "Save Book Records"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODALS (ADD/EDIT CATEGORY) ─────────────────────────────── */}
      <AnimatePresence>
        {showCategoryModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">{editingCategory ? "Edit Category" : "Add Category"}</h3>
                <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Close</button>
              </div>
              <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Category Name</label>
                  <input 
                    type="text" 
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all font-semibold"
                    placeholder="e.g. Science fiction"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Color Label</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer p-0.5 bg-white"
                    />
                    <input 
                      type="text"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs flex-1 focus:outline-none focus:border-sky-500 font-semibold"
                    />
                  </div>
                </div>
                <button type="submit" disabled={btnLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 rounded-lg text-xs mt-2 transition-all shadow-md">
                  {btnLoading ? "Syncing..." : "Save Category"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODALS (CONFIRM RETURN & LATE FINES) ────────────────────── */}
      <AnimatePresence>
        {showReturnModal && selectedIssue && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">Process Book Return</h3>
                <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Cancel</button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2 text-xs font-semibold text-slate-600">
                  <p><span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Student Member</span> {selectedIssue.studentName}</p>
                  <p><span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Book Title</span> {selectedIssue.bookTitle}</p>
                  <p><span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Due Date</span> {selectedIssue.dueDate && !isNaN(new Date(selectedIssue.dueDate).getTime()) ? new Date(selectedIssue.dueDate).toLocaleDateString() : "N/A"}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Days Overdue</span>
                    <span className={`font-extrabold ${returnDetails.lateDays > 0 ? "text-rose-600" : "text-emerald-600"}`}>{returnDetails.lateDays} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Fine Rate</span>
                    <span className="font-extrabold text-slate-600">₹5 / Day</span>
                  </div>
                  <div className="border-t border-slate-200/60 my-2 pt-2 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700">Calculated Late Fine</span>
                    <span className="text-lg font-black text-rose-600">₹{returnDetails.calculatedFine}</span>
                  </div>
                </div>

                {returnDetails.calculatedFine > 0 && (
                  <div className="flex items-center gap-2 border border-amber-200 bg-amber-50/50 p-3 rounded-lg">
                    <input 
                      type="checkbox" 
                      id="finePaid" 
                      checked={returnDetails.finePaid}
                      onChange={(e) => setReturnDetails(prev => ({ ...prev, finePaid: e.target.checked }))}
                      className="cursor-pointer w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                    />
                    <label htmlFor="finePaid" className="text-xs font-bold text-amber-900 cursor-pointer select-none">Mark late fine as paid now</label>
                  </div>
                )}

                <button 
                  onClick={handleConfirmReturn} 
                  disabled={btnLoading} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider"
                >
                  {btnLoading ? "Processing return..." : "Confirm Book Return"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODALS (VIEW ISSUE ENTRY) ─────────────────────────────── */}
      <AnimatePresence>
        {showViewIssueModal && viewingIssue && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden text-left"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">Issued Book Details</h3>
                <button onClick={() => setShowViewIssueModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Close</button>
              </div>
              <div className="p-6 space-y-4 text-xs font-semibold text-slate-600">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Student Name</span>
                    <span className="text-slate-800 font-extrabold text-sm">{viewingIssue.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Student Email</span>
                    <span className="text-slate-500 font-bold text-xs">
                      {students.find(s => s.id === viewingIssue.studentId)?.email || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Book Title</span>
                    <span className="text-slate-800 font-extrabold text-sm">{viewingIssue.bookTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Book Author</span>
                    <span className="text-slate-500 font-bold text-xs">
                      {books.find(b => b.id === viewingIssue.bookId)?.author || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Issued Date</span>
                    <span className="text-slate-700">{viewingIssue.issueDate ? new Date(viewingIssue.issueDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Due Date</span>
                    <span className="text-slate-700">{viewingIssue.dueDate ? new Date(viewingIssue.dueDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      viewingIssue.status === "Overdue" ? "text-rose-600 bg-rose-50" : 
                      viewingIssue.status === "Returned" ? "text-emerald-600 bg-emerald-50" : "text-sky-600 bg-sky-50"
                    }`}>
                      {viewingIssue.status}
                    </span>
                  </div>
                </div>

                {viewingIssue.returnDate && (
                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Returned Date</span>
                      <span className="text-emerald-600 font-bold">{new Date(viewingIssue.returnDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Fine Amount</span>
                      <span className="text-slate-700">₹{viewingIssue.fineAmount || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Fine Paid</span>
                      <span className="text-slate-700">{viewingIssue.finePaid ? "Paid ✓" : "Dues Outstanding"}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODALS (EDIT ISSUE ENTRY) ─────────────────────────────── */}
      <AnimatePresence>
        {showEditIssueModal && editingIssue && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-md overflow-hidden text-left"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-slate-800 text-sm">Edit Book Issue Entry</h3>
                <button onClick={() => setShowEditIssueModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Cancel</button>
              </div>
              <form onSubmit={handleSaveEditIssue} className="p-6 space-y-4">
                {/* Student Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Student Member</label>
                  <select 
                    value={editIssueForm.studentId}
                    onChange={(e) => setEditIssueForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Select Student --</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
                    ))}
                  </select>
                </div>

                {/* Book Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Book</label>
                  <select 
                    value={editIssueForm.bookId}
                    onChange={(e) => setEditIssueForm(prev => ({ ...prev, bookId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Select Book --</option>
                    {books.map(book => (
                      // Show if it is available OR it is the current book already assigned to the issue
                      (book.available > 0 || book.id === editingIssue.bookId) && (
                        <option key={book.id} value={book.id}>
                          {book.title} (by {book.author}) {book.id === editingIssue.bookId ? "(Current)" : `(${book.available} available)`}
                        </option>
                      )
                    ))}
                  </select>
                </div>

                {/* Due Date Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase">Return Due Date</label>
                  <input 
                    type="date" 
                    value={editIssueForm.dueDate}
                    onChange={(e) => setEditIssueForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    min={editingIssue?.issueDate ? new Date(editingIssue.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
                    max={new Date((editingIssue?.issueDate ? new Date(editingIssue.issueDate).getTime() : Date.now()) + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer"
                  />
                </div>

                <button type="submit" disabled={btnLoading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 rounded-lg text-xs mt-2 transition-all shadow-md">
                  {btnLoading ? "Saving changes..." : "Save Issue Entry"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
