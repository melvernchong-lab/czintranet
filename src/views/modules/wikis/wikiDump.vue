<template>
  <div class="wiki-content">
    <!-- Page Heading & Breadcrumbs -->
    <div class="page-header">
      <nav class="breadcrumbs">
        <a href="#" class="breadcrumb-item">Knowledge Base</a>
        <span class="material-symbols-outlined">chevron_right</span>
        <a href="#" class="breadcrumb-item">Wiki Spaces</a>
        <span class="material-symbols-outlined">chevron_right</span>
        <span class="breadcrumb-current">Best Practices</span>
      </nav>

      <div class="header-main">
        <div class="header-text">
          <h1 class="page-title">Wiki & Document Library</h1>
          <p class="page-subtitle">
            Manage project documentation, standards, and organizational knowledge.
          </p>
        </div>

        <div class="header-actions">
          <div class="view-toggle">
            <button class="view-btn active">
              <span class="material-symbols-outlined">grid_view</span>
            </button>
            <button class="view-btn">
              <span class="material-symbols-outlined">list</span>
            </button>
          </div>

          <div class="create-dropdown">
            <button class="create-btn" @click="toggleCreateMenu">
              <span class="material-symbols-outlined">add_circle</span>
              <span>Create New</span>
              <span class="material-symbols-outlined">keyboard_arrow_down</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recently Updated Section -->
    <section class="recent-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="material-symbols-outlined">history</span>
          Recently Updated
        </h2>
        <a href="#" class="view-all-link">View History</a>
      </div>

      <div class="recent-grid">
        <div
          v-for="item in recentItems"
          :key="item.id"
          class="recent-card"
          @click="openDocument(item)"
        >
          <div class="card-header">
            <div :class="['icon-container', item.typeColor]">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </div>
            <span class="document-type">{{ item.type }}</span>
          </div>

          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-meta">Updated {{ item.timeAgo }} by {{ item.updatedBy }}</p>

          <div class="collaborators">
            <div
              v-for="(collab, index) in item.collaborators"
              :key="index"
              class="collaborator-avatar"
              :class="collab.class"
            >
              <span v-if="collab.count" class="collab-count">+{{ collab.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Document Table Section -->
    <section class="document-table-section">
      <div class="document-table-container">
        <div class="table-header">
          <h2 class="table-title">All Documents & Pages</h2>
          <button class="filter-btn" @click="toggleFilters">
            <span class="material-symbols-outlined">filter_list</span>
            Filter
          </button>
        </div>

        <div class="table-wrapper">
          <table class="documents-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Last Modified</th>
                <th>Modified By</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="doc in documents"
                :key="doc.id"
                class="table-row"
                @click="selectDocument(doc)"
                :class="{ locked: doc.locked }"
              >
                <td>
                  <div class="document-name">
                    <span class="material-symbols-outlined" :class="doc.iconClass">{{
                      doc.icon
                    }}</span>
                    <span :class="{ 'text-muted': doc.locked }">{{ doc.name }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['doc-type', doc.typeClass]">{{ doc.type }}</span>
                </td>
                <td :class="{ 'text-muted': doc.locked }">{{ doc.lastModified }}</td>
                <td>
                  <div class="modifier-info">
                    <div class="modifier-avatar">
                      <img
                        v-if="doc.modifierAvatar"
                        :src="doc.modifierAvatar"
                        :alt="doc.modifierName"
                      />
                    </div>
                    <span :class="{ 'text-muted': doc.locked }">{{
                      doc.modifierName
                    }}</span>
                  </div>
                </td>
                <td class="text-right">
                  <div class="action-buttons">
                    <template v-if="!doc.locked">
                      <button class="action-btn" @click.stop="viewDocument(doc)">
                        <span class="material-symbols-outlined">visibility</span>
                      </button>
                      <button class="action-btn" @click.stop="shareDocument(doc)">
                        <span class="material-symbols-outlined">share</span>
                      </button>
                      <button class="action-btn" @click.stop="showMoreOptions(doc)">
                        <span class="material-symbols-outlined">more_vert</span>
                      </button>
                    </template>
                    <button v-else class="action-btn disabled" disabled>
                      <span class="material-symbols-outlined">key</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <p class="table-info">
            Showing {{ documents.length }} of {{ totalDocuments }} items
          </p>
          <div class="pagination">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="pagination-btn" @click="nextPage">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "Wiki",

  setup() {
    // State
    const searchQuery = ref("");
    const currentPage = ref(1);
    const totalDocuments = ref(24);

    // Recent items data
    const recentItems = ref([
      {
        id: 1,
        icon: "edit_document",
        type: "WIKI",
        typeColor: "bg-blue-100 text-blue-600",
        title: "Project Kickoff Framework",
        timeAgo: "2h ago",
        updatedBy: "Sarah J.",
        collaborators: [
          { class: "bg-slate-200" },
          { class: "bg-slate-300" },
          { class: "bg-primary", count: 3 },
        ],
      },
      {
        id: 2,
        icon: "picture_as_pdf",
        type: "PDF",
        typeColor: "bg-red-100 text-red-600",
        title: "Q3 Risk Assessment.pdf",
        timeAgo: "5h ago",
        updatedBy: "Mark T.",
        collaborators: [{ class: "bg-slate-200" }],
      },
      {
        id: 3,
        icon: "table_chart",
        type: "XLSX",
        typeColor: "bg-emerald-100 text-emerald-600",
        title: "Resource Utilization 2024",
        timeAgo: "1d ago",
        updatedBy: "Elena R.",
        collaborators: [{ class: "bg-slate-200" }, { class: "bg-slate-300" }],
      },
      {
        id: 4,
        icon: "article",
        type: "DOCX",
        typeColor: "bg-amber-100 text-amber-600",
        title: "Standard Operating Proc...",
        timeAgo: "2d ago",
        updatedBy: "Sarah J.",
        collaborators: [{ class: "bg-slate-300" }],
      },
    ]);

    // Documents table data
    const documents = ref([
      {
        id: 1,
        icon: "article",
        iconClass: "text-blue-500",
        name: "Technical Architecture Review v2",
        type: "WIKI PAGE",
        typeClass: "type-wiki",
        lastModified: "Oct 24, 2023",
        modifierName: "Sarah Jenkins",
        modifierAvatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAs6EeMvlkgTPIm_Ghc27A-TYb_CyiUweJ4G1vQ2zt6KgwxFRIbZ6CxTU-vw0HcKKaTqpAc2XiLOirNIwBL8QlqqyNuZxhponU9YPdFzS0qc_brfVEGwHPWJcN6K_hAHSRU7H6uz2bcQTu-mnAIwyrJICxzT_25qUFC4oJWzYB7vVJApRza_k6bZIUGIzRCsKXNOloZLwF1HAPvYZVryamsK4nm5WRV6Jm67qDd1Jgw4J9WaUV0gAVrPHwi5nK39cB32BfvRhnQFvE",
        locked: false,
      },
      {
        id: 2,
        icon: "picture_as_pdf",
        iconClass: "text-red-500",
        name: "Change Management Protocol",
        type: "PDF",
        typeClass: "type-pdf",
        lastModified: "Oct 22, 2023",
        modifierName: "Mark Thompson",
        modifierAvatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCE8vQSTCxUBv67BBegugOWjvrv6YLuPa1ni490wxh-3Ko_Q2wfQxDxWd5fFe-JlC8z5fLB3oUSTmcHCNROWAq5KPYsidTDDAadNsniCgAAZQOJvyZbuxBfjREBgqACZ7aA7u2a-jBH9XEF0rcmokqLWVp4QO2btNPsxRPk3aSDRxIiX3y33BWFVoM7sZl__ntCHGcudcLw5_647eyE5MJ-uqWlyZLcS_HUAzGT3_93xEl1Vo5QjcE9AhVWPtjhpNdXwhyXAjhrwxA",
        locked: false,
      },
      {
        id: 3,
        icon: "description",
        iconClass: "text-emerald-500",
        name: "Stakeholder Engagement Plan",
        type: "DOCX",
        typeClass: "type-doc",
        lastModified: "Oct 20, 2023",
        modifierName: "Elena Rodriguez",
        modifierAvatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCC_GOHiWhsKRUFIuMk41kZhde7s9zrM0AHnA9upkBQc7YOjRdz-ZWO8ZnyGEcoDhfu8FciX5q6MRYGVpLNbyIj48u2VNkEPVNuKRF0FSO2PFoK1O9zPk6MJ7daUsdPg3HThbcMmwvGYymFcevryGepLMK4UIjM1AcEv6yAUlPr9TcppizKZkTJx6sqkEwUDR-qBoCiLw2m4B5KgS7wx_00B0lhxBfpPdgR-mNSy5vR3mKYnXyqGrngN6OtXPqUjq1gDmADOkhjZkM",
        locked: false,
      },
      {
        id: 4,
        icon: "lock",
        iconClass: "text-slate-400",
        name: "Confidential Budgeting Rules",
        type: "LOCKED",
        typeClass: "type-locked",
        lastModified: "Oct 19, 2023",
        modifierName: "Admin Only",
        modifierAvatar:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB5MUDjnQBEok6C59pqhKsI1bglA0V-wgHbRJJQZ-iGleX4vT4X1ZwMB311t1j90yC1rjA8vLoxct7D0zGZoIhmzK_mk9FGZy_RENFkMRneLEvgzZ1W37fY_0gxBGa9MGvTZqhTdreWvodDJ23xl6VPfdexvM0pcPKwG7UGNkiYGIiWk8xZYEmGxH169vUos6XcmhuoON-6GAdOSJdcmt5JOeo4Ry2XZXTmcYKf2gj6D3N5uuY-od2AstSGsu1c3C1n4bNC5A8Rnig",
        locked: true,
      },
    ]);

    // Methods
    const openDocument = (item) => {
      console.log("Open document:", item.title);
    };

    const toggleFilters = () => {
      console.log("Toggle filters");
    };

    const selectDocument = (doc) => {
      if (!doc.locked) {
        console.log("Select document:", doc.name);
      }
    };

    const viewDocument = (doc) => {
      console.log("View document:", doc.name);
    };

    const shareDocument = (doc) => {
      console.log("Share document:", doc.name);
    };

    const showMoreOptions = (doc) => {
      console.log("Show more options for:", doc.name);
    };

    const toggleCreateMenu = () => {
      console.log("Toggle create menu");
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
        console.log("Previous page:", currentPage.value);
      }
    };

    const nextPage = () => {
      currentPage.value++;
      console.log("Next page:", currentPage.value);
    };

    return {
      // State
      searchQuery,
      currentPage,
      totalDocuments,

      // Data
      recentItems,
      documents,

      // Methods
      openDocument,
      toggleFilters,
      selectDocument,
      viewDocument,
      shareDocument,
      showMoreOptions,
      toggleCreateMenu,
      prevPage,
      nextPage,
    };
  },
};
</script>

<style>
  @import '../../../styles/views/wiki/wiki.css'
</style>