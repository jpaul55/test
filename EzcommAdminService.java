package com.optum.riptide.ezcommui.adminui.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.json.JsonSanitizer;
import com.optum.riptide.ezcommui.adminui.constants.AdminUiPropertiesBean;
import com.optum.riptide.ezcommui.adminui.entities.*;
import com.optum.riptide.ezcommui.adminui.entities.TemplateType;
import com.optum.riptide.ezcommui.adminui.enums.AuditAction;
import com.optum.riptide.ezcommui.adminui.enums.NotifTemplateType;
import com.optum.riptide.ezcommui.adminui.exceptions.ValidationException;
import com.optum.riptide.ezcommui.adminui.model.*;
import com.optum.riptide.ezcommui.adminui.repository.*;
import com.optum.riptide.ezcommui.adminui.utils.DateTimeUtils;
import com.optum.riptide.ezcommui.adminui.utils.TemplateParamsUtils;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.CampaignFilterVO;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.CampaignVO;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.DeleteBoBItemResponse;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.DeleteProgramIdResponse;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.FilterCategoryVO;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.FilterItemVO;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.ProgramIdVO;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.SaveBoBItemsResponse;
import com.optum.riptide.ezcommui.adminui.valueobjects.response.SaveProgramIdsResponse;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class EzcommAdminService {

    private final Logger LOGGER = LoggerFactory.getLogger(this.getClass());
    private final String NO_REPLY = "NO-REPLY";

    @Autowired
    private ClientContextRepository clientContextRepository;
    @Autowired
    private  StandardTemplateRepository standardTemplateRepository;
    @Autowired
    private  TemplateTypeRepository templateTypeRepository;
    @Autowired
    private  NotificationTemplateRepository notificationTemplateRepository;
    @Autowired
    private  MenuEntityRepository menuEntityRepository;
    @Autowired
    private  CampaignRepository campaignRepository;
    @Autowired
    private EmailSettingRepository emailSettingRepository;
    @Autowired
    private CampaignToEmailSettingRepository campaignToEmailSettingRepository;
    @Autowired
    private  FilterCategoryItemRepository filterCategoryItemRepository;
    @Autowired
    private  FilterEntryRepository filterEntryRepository;
    @Autowired
    private  FilterRuleRepository filterRuleRepository;
    @Autowired
    private  FilterCategoryRepository filterCategoryRepository;
    @Autowired
    private  CampaignAuditTrailService campaignAuditTrailService;
    @Autowired
    private  RoleService roleService;
    @Autowired
    private AdminUiPropertiesBean adminUiPropertiesBean;
    @Autowired
    private SmsManagerSettingRepository smsManagerSettingRepository;
    @Autowired
    private CampaignToSmsManagerSettingRepository campaignToSmsManagerSettingRepository;
    @Autowired


    public List<ClientContext> retrieveClientContextByRoles() {
        List<ClientContext> clientContexts = clientContextRepository.findAll();
        return clientContexts;
    }

  public Object[] getCampaignIdAndTitleAndDescription(long menuEntityId) {
    Object[] result = menuEntityRepository.findCampaignIdTitleAndDescriptionByMenuEntityId(menuEntityId);
    if (result == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "MenuEntity not found with ID: " + menuEntityId);
    }
    return result;
  }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CampaignModel createCampaign(final CampaignModel newCampaign) {
        MenuEntity menuEntity = menuEntityRepository.findByClientContextList_ClientContextIdAndNameIgnoreCase(newCampaign.getClientContextId(), newCampaign.getName());
        if (menuEntity != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Campaign name already exists!");
        } else {
            menuEntity = new MenuEntity();
        }
        List<ClientContext> clientContextsEntity = new ArrayList<>();
        List<NotificationTemplate> notificationTemplateList = new ArrayList<>();
        List<ClientContext> clientContexts = clientContextRepository.findAll();
        List<Campaign> campaigns = campaignRepository.findAll();
        List<TemplateType> templateTypeList = templateTypeRepository.findAll();
      StandardTemplate standardTemplate = standardTemplateRepository.findById(
          Optional.ofNullable(newCampaign.getMessageTemplateId()).orElse(1L)
      ).get();
        final Timestamp timestamp = DateTimeUtils.formatNow();


        menuEntity.setClientContextList(clientContextsEntity);
        clientContextsEntity.add(clientContexts.stream()
                .filter(t -> t.getClientContextId() == newCampaign.getClientContextId())
                .findAny().orElse(null));

        menuEntity.setCampaign(campaigns.stream()
                .filter(Objects::nonNull)
                .filter(t -> t.getCampaignId() == newCampaign.getSettingId())
                .findAny().orElse(null));
        menuEntity.setCampaignName(newCampaign.getCampaignName() != null ? newCampaign.getCampaignName() : newCampaign.getName());
        menuEntity.setName(newCampaign.getName());
        menuEntity.setTitle(newCampaign.getTitle());
        menuEntity.setDescription(newCampaign.getDescription());
        if (newCampaign.getSubjectLine() != null && !newCampaign.getSubjectLine().isBlank()) {
            menuEntity.setSubjectLine(newCampaign.getSubjectLine());
        }
        menuEntity.setNotificationTemplateList(notificationTemplateList);
        menuEntity.setDisclaimer(newCampaign.getDisclaimer());

        // Save menu entity
        final MenuEntity insertedMenuEntity = menuEntityRepository.save(menuEntity);

        // Save email setting
        // First, retrieve email_setting_id from campaign_to_email_setting if campaign exists
//        Integer campaignId = menuEntity.getCampaign() != null ? menuEntity.getCampaign().getCampaignId() : null;
//        if (campaignId != null) {
//            Optional<Integer> emailSettingIdOpt = campaignToEmailSettingRepository.findEmailSettingIdByCampaignId(campaignId);
//            if (emailSettingIdOpt.isPresent()) {
//                // Check if email setting already exists
//                Optional<EmailSetting> existingEmailSetting = emailSettingRepository.findById(emailSettingIdOpt.get());
//                if (existingEmailSetting.isPresent()) {
//                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Sender email address already exists!");
//                }
//            }
//        }

        // Create new email setting
//        EmailSetting newEmailSetting = new EmailSetting();
//        newEmailSetting.setSenderName(NO_REPLY);
//        newEmailSetting.setSenderEmailAddress(newCampaign.getSenderEmail());
//        EmailSetting savedEmailSetting = emailSettingRepository.save(newEmailSetting);

        // Create campaign_to_email_setting mapping if campaign exists
//        if (campaignId != null) {
//            CampaignToEmailSetting campaignToEmailSetting = new CampaignToEmailSetting();
//            campaignToEmailSetting.setCampaignId(campaignId);
//            campaignToEmailSetting.setEmailSettingId(savedEmailSetting.getEmailSettingId());
//            campaignToEmailSettingRepository.save(campaignToEmailSetting);
//        }

        String interactionType = NotifTemplateType.BOTH.getInteractionType();
        if (newCampaign.getTemplateTypes().size() == 1 ) {
            interactionType = NotifTemplateType.valueOf(newCampaign.getTemplateTypes().get(0)).getInteractionType();
        }

        // Create template
        newCampaign.getTemplateTypes().stream().forEach(templateType-> {
            // Save all notification template
            NotificationTemplate notificationTemplate = new NotificationTemplate();
            notificationTemplate.setName(newCampaign.getName() + "_"
                    + templateType.toUpperCase() + "_"
                    + insertedMenuEntity.getMenuEntityId());
            notificationTemplate.setTemplateBody(null);

            String urlLink = "EMAIL".equalsIgnoreCase(templateType) ? newCampaign.getUrlLinkEmail() : newCampaign.getUrlLinkSMS();
            notificationTemplate.setTemplateParams(new TemplateParam(urlLink, newCampaign.getUrlLabel()).toString());

            notificationTemplate.setTemplateType(templateTypeList.stream().filter(t-> t.getTemplateTypeValue().equalsIgnoreCase(templateType.toUpperCase()))
                    .findAny().orElse(null));

            notificationTemplate.setStandardTemplate(standardTemplate);
            notificationTemplateRepository.save(notificationTemplate);
            notificationTemplateList.add(notificationTemplate);
        });

        final List<AuditTrailCampaignFilterModel> newCampaignFilterModelList = new ArrayList<>();
        if (newCampaign.getCampaignFilters() != null && !newCampaign.getCampaignFilters().isEmpty()) {
            //Campaign Filter
            newCampaign.getCampaignFilters().stream()
                    .forEach(campaignFilter -> {
                        // New Filter
                        addNewFilter(insertedMenuEntity, campaignFilter);
                    });

            //creation of audit trail for create campaign
            newCampaign.getCampaignFilters().stream()
                    .forEach(campaignFilter -> {
                        AuditTrailCampaignFilterModel auditTrailCampaignFilterModel = new AuditTrailCampaignFilterModel();
                        auditTrailCampaignFilterModel.setCategoryCode(campaignFilter.getCategory());
                        auditTrailCampaignFilterModel.setFilterType(campaignFilter.getRule());
                        auditTrailCampaignFilterModel.setValue(campaignFilter.getValue());
                        newCampaignFilterModelList.add(auditTrailCampaignFilterModel);
                    });
        }

        //Create campaign audit trail
        String urlLink = StringUtils.isNotBlank(newCampaign.getUrlLinkEmail()) ? newCampaign.getUrlLinkEmail() : newCampaign.getUrlLinkSMS();
        campaignAuditTrailService.createAuditTrail(insertedMenuEntity, AuditAction.CREATE.toString(),
                null,
                campaignAuditTrailService.auditTrailValue(insertedMenuEntity, urlLink, newCampaign.getUrlLabel(), newCampaign.getMessageTemplateId(),
                newCampaign.getClientContextId(),interactionType, newCampaignFilterModelList),
                timestamp, "agentId"); //Hardcoded user id for now need to either remove it or fetch it from UI

        return toCampaignModel(insertedMenuEntity, newCampaign);
    }

    public RemoveModel deleteCampaign(final Long idParam) {

        final MenuEntity menuEntity = menuEntityRepository.getByMenuEntityId(idParam);

        if (menuEntity ==  null) {
            throw new ValidationException("Campaign with ID " + idParam + " not found");
        }
        final Timestamp timestamp = DateTimeUtils.formatNow();

        final NotificationTemplate notificationTemplateAudit = menuEntity.getNotificationTemplateList().get(0);

        String interactionType = NotifTemplateType.BOTH.getInteractionType();
        if(menuEntity.getNotificationTemplateList().size() == 1 ) {
            interactionType = NotifTemplateType.valueOf(menuEntity.getNotificationTemplateList().get(0).getTemplateType().getTemplateTypeValue()).getInteractionType();
        }

        final List<AuditTrailCampaignFilterModel> oldCampaignFilterModelList = new ArrayList<>();
        final List<FilterRule> filterRuleList = filterRuleRepository.findByMenuEntityId(menuEntity.getMenuEntityId());
        if(filterRuleList.size() != 0 || !filterRuleList.isEmpty() || filterRuleList != null) {
            filterRuleList.stream()
                    .forEach(filterRule -> {
                        List<FilterEntry> filterEntry = filterEntryRepository.findByFilterRule(filterRule);
                        filterEntry.stream().forEach(filterEntry1 -> {
                            AuditTrailCampaignFilterModel auditTrailCampaignFilterModel = new AuditTrailCampaignFilterModel();
                            auditTrailCampaignFilterModel.setCategoryCode(filterRule.getFilterCategoryCd());
                            auditTrailCampaignFilterModel.setFilterType(filterRule.getFilterType());
                            auditTrailCampaignFilterModel.setValue(filterEntry1.getValue());
                            oldCampaignFilterModelList.add(auditTrailCampaignFilterModel);
                        });
                    });
        }
        final String oldValue = campaignAuditTrailService.auditTrailValue(menuEntity,
                TemplateParamsUtils.extractUrlLink(notificationTemplateAudit.getTemplateParams()),
                TemplateParamsUtils.extractUrlLabel(notificationTemplateAudit.getTemplateParams()),
                extractStandardTemplateId(menuEntity.getNotificationTemplateList()),
                menuEntity.getClientContextList().get(0).getClientContextId(), interactionType,oldCampaignFilterModelList);

                // Removing from menu_to_client_context table
                final List<Long> clientContextIds = menuEntity.getClientContextList().stream()
                .map(t -> t.getClientContextId())
                .collect(Collectors.toList());

                clientContextIds.stream()
                .forEach(t -> {
                     ClientContext clientContext = clientContextRepository.getByClientContextId(t);
                     menuEntity.getClientContextList().remove(clientContext);
                 });

        //Create campaign audit trail
        campaignAuditTrailService.createAuditTrail(menuEntity, AuditAction.DELETE.toString(),
                oldValue,
                null,
                timestamp, "agentId"); //Hardcoded user id for now need to either remove it or fetch it from UI


        return new RemoveModel(idParam.toString());
    }


    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CampaignModel updateCampaign(final long menuId, final CampaignModel campaign) {

        MenuEntity menuEntity = menuEntityRepository.findByClientContextList_ClientContextIdAndNameIgnoreCase(campaign.getClientContextId(), campaign.getName());
        if (menuEntity !=null && menuEntity.getMenuEntityId() != menuId) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Campaign name already exists!");
        }
        if (menuEntity == null) {
            menuEntity = menuEntityRepository.findByMenuEntityIdAndClientContextList_ClientContextId(menuId, campaign.getClientContextId());
        }
        if (menuEntity == null) {
            throw new ValidationException(String.format("Campaign with menu ID: %d not found", menuId));
        }

        AuditTrailModel oldAuditTrail = AuditTrailModel.instanceOf(menuEntity, campaign);

        // Always set name from the campaign model
        menuEntity.setName(campaign.getName());

        // Set campaignName from the separate campaignName field
        if (campaign.getCampaignName() != null && !campaign.getCampaignName().isEmpty()) {
            menuEntity.setCampaignName(campaign.getCampaignName());
        } else {
            menuEntity.setCampaignName(campaign.getName());
        }
        menuEntity.setSubjectLine(campaign.getSubjectLine());
        menuEntity.setTitle(campaign.getTitle()); // Update title
        menuEntity.setDescription(campaign.getDescription()); // Update description
        menuEntity.setDisclaimer(campaign.getDisclaimer());

        final Integer settingId = campaign.getSettingId();
        if (!Objects.equals(menuEntity.getCampaign().getCampaignId(), settingId)) {
          Campaign entityCampaign = campaignRepository.findById(settingId).orElse(null);
          menuEntity.setCampaign(entityCampaign);
        }

      final StandardTemplate standardTemplate = campaign.getMessageTemplateId() != null ? standardTemplateRepository.findById(campaign.getMessageTemplateId()).orElse(null) : null;

        final List<TemplateType> templateTypes = templateTypeRepository.findAll();
        final Map<String, NotificationTemplate> existingTemplateMap = menuEntity.getNotificationTemplateList().stream()
                .collect(Collectors.toMap(nt -> nt.getTemplateType().getTemplateTypeValue(), nt -> nt));

        String interactionType = NotifTemplateType.BOTH.getInteractionType();
        for (String type: campaign.getTemplateTypes()) {
            String urlLink = "EMAIL".equalsIgnoreCase(type) ? campaign.getUrlLinkEmail() : campaign.getUrlLinkSMS();
            NotificationTemplate existingTemplate = existingTemplateMap.get(type);
            if (existingTemplate == null) {
                NotificationTemplate notifTemplateToSave = new NotificationTemplate();
                notifTemplateToSave.setName(String.format("%s_%s_%d", menuEntity.getCampaignName(), type, menuEntity.getMenuEntityId()));
                notifTemplateToSave.setTemplateBody(null);
                notifTemplateToSave.setTemplateParams(new TemplateParam(urlLink, campaign.getUrlLabel()).toString());
                notifTemplateToSave.setTemplateType(templateTypes.stream().filter(t-> t.getTemplateTypeValue().equalsIgnoreCase(type)).findAny().orElse(null));
                notifTemplateToSave.setStandardTemplate(standardTemplate);
                menuEntity.getNotificationTemplateList().add(notifTemplateToSave);
            } else {
                existingTemplate.setTemplateParams(new TemplateParam(urlLink, campaign.getUrlLabel()).toString());
                existingTemplate.setStandardTemplate(standardTemplate);
            }
            if (campaign.getTemplateTypes().size() == 1) {
                interactionType = NotifTemplateType.valueOf(type).getInteractionType();
                String typeToDelete = NotifTemplateType.EMAIL.toString().equalsIgnoreCase(type) ?
                        NotifTemplateType.SMS.toString() : NotifTemplateType.EMAIL.toString();
                NotificationTemplate templateToDelete = existingTemplateMap.get(typeToDelete);
                if (templateToDelete != null) {
                    menuEntity.getNotificationTemplateList().remove(templateToDelete);
                    notificationTemplateRepository.delete(templateToDelete);
                }
            }
        }

        MenuEntity updatedMenuEntity = menuEntityRepository.save(menuEntity);

        // EmailSetting - retrieve from campaign_to_email_setting
        Integer campaignId = updatedMenuEntity.getCampaign() != null ? updatedMenuEntity.getCampaign().getCampaignId() : null;
        if (campaignId != null) {
            Optional<Long> emailSettingIdOpt = campaignToEmailSettingRepository.findEmailSettingIdByCampaignId(campaignId);
            if (emailSettingIdOpt.isPresent()) {
                // Retrieve the email setting using the email_setting_id
                Optional<EmailSetting> existingEmailSettingOpt = emailSettingRepository.findById(emailSettingIdOpt.get());
                if (existingEmailSettingOpt.isPresent()) {
                    // Update existing email setting
                    EmailSetting existingEmailSetting = existingEmailSettingOpt.get();
                    existingEmailSetting.setSenderEmailAddress(campaign.getSenderEmail());
                    emailSettingRepository.save(existingEmailSetting);
                } else {
                    throw new ValidationException(String.format("Campaign with menu ID: %d not found", menuId));
                }
            } else {
                throw new ValidationException(String.format("Campaign with menu ID: %d not found", menuId));
            }
        } else {
            throw new ValidationException(String.format("Campaign with menu ID: %d not found", menuId));
        }

        //Campaign Filter
        //Delete all first together with filter rule
      if (campaign.getCampaignFilters() != null && !campaign.getCampaignFilters().isEmpty()) {
        campaign.getCampaignFilters().stream()
                .filter(campaignFilter -> campaignFilter.isDelete() == true)
                .collect(Collectors.toList())
                .stream()
                .forEach(campaignFilterModel -> {
              int length = String.valueOf(campaignFilterModel.getFilterEntryId()).length();
              if(length < 8) {
                filterEntryRepository.deleteById(campaignFilterModel.getFilterEntryId());
                FilterRule filterRuleToRemove = filterRuleRepository.findByFilterCategoryCdAndMenuEntityId(
                    campaignFilterModel.getCategory(), updatedMenuEntity.getMenuEntityId());
                List<FilterEntry> filterEntriesLinkedToRule = filterEntryRepository.findByFilterRule(
                    filterRuleToRemove);
                if (filterEntriesLinkedToRule.size() < 1) {
                  filterRuleRepository.delete(filterRuleToRemove);
                }
              }
        });
        //All filter that is not for delete
        campaign.getCampaignFilters().stream()
                .filter(campaignFilter -> campaignFilter.isDelete() == false)
                .collect(Collectors.toList())
                .stream()
                .forEach(campaignFilter -> {
                  int length = String.valueOf(campaignFilter.getFilterEntryId()).length();
                    if(length > 8) {
                        addNewFilter(updatedMenuEntity, campaignFilter);
                    }
                });
      }
      campaignAuditTrailService.saveAuditTrail(oldAuditTrail, AuditTrailModel.instanceForNewValue(
              campaign, menuId, campaign.getMessageTemplateId(), interactionType), menuId, "hpatel80" ,AuditAction.UPDATE);  //Hardcoded user id for now need to either remove it or fetch it from UI
      return campaign;

    }

    private void addNewFilter(MenuEntity menuEntity, CampaignFilterModel campaignFilter) {
        // New Filter
        FilterRule filterRule;
        FilterRule filterRuleCheck = filterRuleRepository.findByFilterCategoryCdAndMenuEntityId(campaignFilter.getCategory(), menuEntity.getMenuEntityId());

        if(filterRuleCheck == null) {
            FilterRule newFilterRule = new FilterRule();
            newFilterRule.setFilterCategoryCd(campaignFilter.getCategory());
            newFilterRule.setFilterType(campaignFilter.getRule());
            newFilterRule.setMenuEntityId(menuEntity.getMenuEntityId());
            filterRule = filterRuleRepository.save(newFilterRule);
        } else {
            filterRule = filterRuleCheck;
        }
        FilterEntry filterEntry = new FilterEntry();
        filterEntry.setFilterRule(filterRule);
        filterEntry.setValue(campaignFilter.getValue());
        filterEntryRepository.save(filterEntry);
    }


    public List<ProgramModel> retrievePrograms() {
        return campaignRepository.findAll().stream()
                .map(program -> toProgramModel(program))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves detailed program information for the Manage Program IDs modal.
     * Returns: Program Description (campaign.name), Program ID, Client ID,
     * Sender Name, Sender Email from the related tables.
     */
    public List<ProgramDetailModel> retrieveProgramDetails() {
        List<Object[]> results = smsManagerSettingRepository.findAllProgramDetails();

        return results.stream()
                .map(row -> {
                    Integer campaignId = row[0] != null ? ((Number) row[0]).intValue() : null;
                    String programDescription = (String) row[1];
                    String programId = (String) row[2];
                    String clientId = (String) row[3];
                    String senderName = (String) row[4];
                    String senderEmail = (String) row[5];
                    Long smsManagerSettingId = row[6] != null ? ((Number) row[6]).longValue() : null;
                    Long emailSettingId = row[7] != null ? ((Number) row[7]).longValue() : null;

                    return new ProgramDetailModel(
                            campaignId,
                            programDescription,
                            programId,
                            clientId,
                            senderName,
                            senderEmail,
                            smsManagerSettingId,
                            emailSettingId
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Save/Update Program Details including email settings.
     * Handles both existing items (update) and new items (create).
     */
    @Transactional
    public Map<String, Object> saveProgramDetails(com.optum.riptide.ezcommui.adminui.valueobjects.request.SaveProgramDetailsRequest request) {
        log.info("========== SERVICE: saveProgramDetails started ==========");

        List<String> warnings = new ArrayList<>();
        int updatedCount = 0;
        int createdCount = 0;

        // Process existing items (updates)
        if (request.getExistingItems() != null) {
            for (var dto : request.getExistingItems()) {
                try {
                    log.info("Updating existing item: campaignId={}, programId={}, emailSettingId={}",
                        dto.getCampaignId(), dto.getProgramId(), dto.getEmailSettingId());

                    // Update SMS Manager Setting
                    if (dto.getSmsManagerSettingId() != null) {
                        Optional<SmsManagerSetting> smsOpt = smsManagerSettingRepository.findById(dto.getSmsManagerSettingId());
                        if (smsOpt.isPresent()) {
                            SmsManagerSetting sms = smsOpt.get();
                            sms.setProgramId(dto.getProgramId());
                            // Set clientId to null if empty string
                            sms.setOauthClientId(dto.getClientId() != null && !dto.getClientId().trim().isEmpty()
                                ? dto.getClientId() : null);
                            smsManagerSettingRepository.save(sms);
                            log.info("Updated SmsManagerSetting ID: {}", dto.getSmsManagerSettingId());
                        }
                    }

                    // Update Campaign (program description)
                    if (dto.getCampaignId() != null) {
                        Optional<Campaign> campaignOpt = campaignRepository.findById(dto.getCampaignId());
                        if (campaignOpt.isPresent()) {
                            Campaign campaign = campaignOpt.get();
                            campaign.setName(dto.getProgramDescription());
                            campaign.setModified(new Timestamp(System.currentTimeMillis()));
                            campaignRepository.save(campaign);
                            log.info("Updated Campaign ID: {} with description: {}", dto.getCampaignId(), dto.getProgramDescription());
                        }
                    }

                    // Update or Create Email Setting
                    if (dto.getEmailSettingId() != null && dto.getEmailSettingId() > 0) {
                        // Update existing email setting
                        Optional<EmailSetting> emailOpt = emailSettingRepository.findById(dto.getEmailSettingId());
                        if (emailOpt.isPresent()) {
                            EmailSetting email = emailOpt.get();
                            email.setSenderName(dto.getSenderName());
                            email.setSenderEmailAddress(dto.getSenderEmail());
                            emailSettingRepository.save(email);
                            log.info("Updated EmailSetting ID: {}", dto.getEmailSettingId());
                        }
                    } else if (dto.getCampaignId() != null &&
                               ((dto.getSenderName() != null && !dto.getSenderName().trim().isEmpty()) ||
                                (dto.getSenderEmail() != null && !dto.getSenderEmail().trim().isEmpty()))) {
                        // Create new email setting for existing campaign that doesn't have one
                        log.info("Creating new EmailSetting for existing campaign: {}", dto.getCampaignId());

                        EmailSetting email = new EmailSetting();
                        email.setSenderName(dto.getSenderName());
                        email.setSenderEmailAddress(dto.getSenderEmail());
                        EmailSetting savedEmail = emailSettingRepository.save(email);
                        log.info("Created EmailSetting with ID: {}", savedEmail.getEmailSettingId());

                        // Link Campaign to EmailSetting
                        CampaignToEmailSetting junctionEmail = new CampaignToEmailSetting();
                        junctionEmail.setCampaignId(dto.getCampaignId());
                        junctionEmail.setEmailSettingId(savedEmail.getEmailSettingId());
                        campaignToEmailSettingRepository.save(junctionEmail);
                        log.info("Created Campaign-EmailSetting junction for campaign: {}", dto.getCampaignId());
                    }

                    updatedCount++;
                } catch (Exception e) {
                    log.error("Error updating program detail: {}", e.getMessage(), e);
                    warnings.add("Failed to update item with programId: " + dto.getProgramId());
                }
            }
        }

        // Process new items (creates)
        if (request.getNewItems() != null) {
            for (var dto : request.getNewItems()) {
                try {
                    log.info("Creating new item: programDescription={}, programId={}", dto.getProgramDescription(), dto.getProgramId());

                    // 1. Create SmsManagerSetting
                    SmsManagerSetting sms = new SmsManagerSetting();
                    sms.setProgramId(dto.getProgramId());
                    // Set clientId to null if empty string
                    sms.setOauthClientId(dto.getClientId() != null && !dto.getClientId().trim().isEmpty()
                        ? dto.getClientId() : null);
                    SmsManagerSetting savedSms = smsManagerSettingRepository.save(sms);
                    log.info("Created SmsManagerSetting with ID: {}", savedSms.getSettingId());

                    // 2. Create Campaign
                    Campaign campaign = new Campaign();
                    campaign.setName(dto.getProgramDescription());
                    campaign.setLob("EPMP");
                    campaign.setActiveStatus(true);
                    campaign.setCreated(new Timestamp(System.currentTimeMillis()));
                    campaign.setModified(new Timestamp(System.currentTimeMillis()));
                    Campaign savedCampaign = campaignRepository.save(campaign);
                    log.info("Created Campaign with ID: {}", savedCampaign.getCampaignId());

                    // 3. Link Campaign to SmsManagerSetting
                    CampaignToSmsManagerSetting junctionSms = new CampaignToSmsManagerSetting(
                        savedCampaign.getCampaignId(),
                        savedSms.getSettingId().intValue(),
                        "defaultPreference"
                    );
                    campaignToSmsManagerSettingRepository.save(junctionSms);
                    log.info("Created Campaign-SmsManagerSetting junction");

                    // 4. Create EmailSetting if sender info provided
                    if ((dto.getSenderName() != null && !dto.getSenderName().trim().isEmpty()) ||
                        (dto.getSenderEmail() != null && !dto.getSenderEmail().trim().isEmpty())) {

                        EmailSetting email = new EmailSetting();
                        email.setSenderName(dto.getSenderName());
                        email.setSenderEmailAddress(dto.getSenderEmail());
                        EmailSetting savedEmail = emailSettingRepository.save(email);
                        log.info("Created EmailSetting with ID: {}", savedEmail.getEmailSettingId());

                        // 5. Link Campaign to EmailSetting
                        CampaignToEmailSetting junctionEmail = new CampaignToEmailSetting();
                        junctionEmail.setCampaignId(savedCampaign.getCampaignId());
                        junctionEmail.setEmailSettingId(savedEmail.getEmailSettingId());
                        campaignToEmailSettingRepository.save(junctionEmail);
                        log.info("Created Campaign-EmailSetting junction");
                    }

                    createdCount++;
                } catch (Exception e) {
                    log.error("Error creating program detail: {}", e.getMessage(), e);
                    warnings.add("Failed to create item with programId: " + dto.getProgramId());
                }
            }
        }

        log.info("========== SERVICE: saveProgramDetails completed ==========");
        log.info("Updated: {}, Created: {}, Warnings: {}", updatedCount, createdCount, warnings.size());

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", warnings.isEmpty());
        response.put("updatedCount", updatedCount);
        response.put("createdCount", createdCount);
        response.put("warnings", warnings);

        // Return updated list - fetch in a separate try-catch to avoid breaking the response
        try {
            List<ProgramDetailModel> updatedList = retrieveProgramDetails();
            response.put("programDetails", updatedList);
        } catch (Exception e) {
            log.error("Error retrieving updated program details: {}", e.getMessage(), e);
            response.put("programDetails", new ArrayList<>());
            warnings.add("Could not retrieve updated list");
        }

        return response;
    }

    public List<MessageTemplateModel> retrieveMessageTemplate() {
        return standardTemplateRepository.findAll().stream()
                .map(standardTemplate -> toMessageTemplateModel(standardTemplate))
                .collect(Collectors.toList());
    }

    private ProgramModel toProgramModel(final Campaign campaign) {
      String senderEmail = null;
      if (campaign.getCampaignId() != null) {
        Optional<Long> emailSettingIdOpt = campaignToEmailSettingRepository.findEmailSettingIdByCampaignId(campaign.getCampaignId());
        if (emailSettingIdOpt.isPresent()) {
          Optional<EmailSetting> emailSettingOpt = emailSettingRepository.findById(emailSettingIdOpt.get());
          senderEmail = emailSettingOpt.map(EmailSetting::getSenderEmailAddress).orElse(null);
        }
      }
      return new ProgramModel(campaign.getCampaignId(), campaign.getName(), senderEmail);
    }

    private MessageTemplateModel toMessageTemplateModel(final StandardTemplate standardTemplate) {
        if (StringUtils.isBlank(standardTemplate.getEmailTemplateBody())) {
            return new MessageTemplateModel(standardTemplate.getStandardTemplateId(), standardTemplate.getName(), new String[]{"SMS"});
        }
        if (StringUtils.isBlank(standardTemplate.getSmsTemplateBody())) {
            return new MessageTemplateModel(standardTemplate.getStandardTemplateId(), standardTemplate.getName(), new String[]{"EMAIL"});
        }
        return new MessageTemplateModel(standardTemplate.getStandardTemplateId(), standardTemplate.getName(), new String[]{"EMAIL","SMS"});
    }

    private CampaignModel toCampaignModel(MenuEntity entity, CampaignModel newCampaign) {
        return new CampaignModel(entity.getClientContextList().get(0).getClientContextId(), entity.getName(), entity.getCampaignName(),
                newCampaign.getUrlLinkEmail(), newCampaign.getUrlLinkSMS(), newCampaign.getUrlLabel(), newCampaign.getSettingId(),
                newCampaign.getTemplateTypes(), newCampaign.getMessageTemplateId(), entity.getSubjectLine(), entity.getTitle(), entity.getDescription(),
                newCampaign.getDisclaimer(), newCampaign.getSenderEmail());
    }

    public List<FilterItemVO> getFilterCategoryItems() {
        log.info("========== SERVICE: getFilterCategoryItems started ==========");
        List<FilterCategoryItem> filterCategoryItems = filterCategoryItemRepository.findAll(Sort.by(Sort.Direction.ASC,"description"));
        log.info("SERVICE: Retrieved {} filter category items from database", filterCategoryItems.size());

        if (filterCategoryItems.isEmpty()) {
            log.warn("SERVICE: No filter category items found in database!");
            return Collections.EMPTY_LIST;
        }

        // Count by category
        Map<String, Long> categoryCounts = filterCategoryItems.stream()
            .collect(Collectors.groupingBy(FilterCategoryItem::getFilterCategoryCd, Collectors.counting()));
        log.info("SERVICE: Items by category: {}", categoryCounts);

        // Log all BoB items specifically
        filterCategoryItems.stream()
            .filter(item -> "BoB".equals(item.getFilterCategoryCd()))
            .forEach(item -> log.info("SERVICE: BoB item from DB - ID: {}, Code: {}, Description: {}",
                item.getId(), item.getCode(), item.getDescription()));

        List<FilterItemVO> result = filterCategoryItems.stream().map(
                item -> new FilterItemVO(item.getId(), item.getDescription(), item.getCode(), item.getFilterCategoryCd())
            ).collect(Collectors.toList());

        log.info("SERVICE: Returning {} filter item VOs", result.size());
        log.info("========== SERVICE: getFilterCategoryItems completed ==========");
        return result;
    }

    public List<FilterCategoryVO> getFilterCategories() {
        List<FilterCategory> filterCategories = filterCategoryRepository.findAll();
        if (filterCategories.isEmpty()) {
            return Collections.EMPTY_LIST;
        }
        return filterCategories.stream().map(
                category -> new FilterCategoryVO(category.getFilterCategoryCd(), category.getFilterCategoryName(), category.getInputType())
        ).collect(Collectors.toList());
    }

    @Transactional
    public SaveBoBItemsResponse saveBoBItems(List<FilterCategoryItem> bobItemsToSave) {
        log.info("========== SERVICE: saveBoBItems started ==========");
        log.info("SERVICE: Saving BoB items, count: {}", bobItemsToSave.size());
        List<String> warnings = new ArrayList<>();

        // Get ALL existing filter category items (not just BoB)
        List<FilterCategoryItem> allExistingItems = filterCategoryItemRepository.findAll();
        log.info("SERVICE: Found {} total existing filter category items in database", allExistingItems.size());
        Map<String, FilterCategoryItem> allExistingByCode = allExistingItems.stream()
            .collect(Collectors.toMap(FilterCategoryItem::getCode, item -> item, (first, second) -> first));

        // Get existing BoB items specifically
        List<FilterCategoryItem> existingBobItems = filterCategoryItemRepository.findByFilterCategoryCd("BoB");
        log.info("SERVICE: Found {} existing BoB items in database", existingBobItems.size());
        Map<String, FilterCategoryItem> existingBobByCode = existingBobItems.stream()
            .collect(Collectors.toMap(FilterCategoryItem::getCode, item -> item));

        // Check for duplicate codes in the incoming list
        Set<String> seenCodes = new HashSet<>();
        List<String> duplicatesInRequest = new ArrayList<>();
        for (FilterCategoryItem item : bobItemsToSave) {
            if (!seenCodes.add(item.getCode())) {
                duplicatesInRequest.add(item.getCode());
            }
        }

        if (!duplicatesInRequest.isEmpty()) {
            log.warn("SERVICE: Duplicate codes found in request: {}", duplicatesInRequest);
            warnings.add("Duplicate BoB codes in request: " + String.join(", ", duplicatesInRequest));
            // Remove duplicates - keep first occurrence
            bobItemsToSave = bobItemsToSave.stream()
                .collect(Collectors.toMap(
                    FilterCategoryItem::getCode,
                    item -> item,
                    (first, second) -> first
                ))
                .values()
                .stream()
                .collect(Collectors.toList());
        }

        // Check if new BoB codes conflict with existing codes from OTHER categories
        List<String> conflictingCodes = new ArrayList<>();
        for (FilterCategoryItem newItem : bobItemsToSave) {
            // Skip if this code already exists as a BoB item (we'll update it)
            if (existingBobByCode.containsKey(newItem.getCode())) {
                continue;
            }

            // Check if this code exists in a different category
            FilterCategoryItem existingItem = allExistingByCode.get(newItem.getCode());
            if (existingItem != null && !"BoB".equals(existingItem.getFilterCategoryCd())) {
                conflictingCodes.add(newItem.getCode() + " (already used in " + existingItem.getFilterCategoryCd() + ")");
                log.warn("SERVICE: BoB code {} conflicts with existing {} item", newItem.getCode(), existingItem.getFilterCategoryCd());
            }
        }

        if (!conflictingCodes.isEmpty()) {
            warnings.add("BoB codes already exist in other categories: " + String.join(", ", conflictingCodes));
            // Remove conflicting items from save list
            Set<String> conflictingCodesSet = conflictingCodes.stream()
                .map(s -> s.split(" ")[0])
                .collect(Collectors.toSet());
            bobItemsToSave = bobItemsToSave.stream()
                .filter(item -> !conflictingCodesSet.contains(item.getCode()) || existingBobByCode.containsKey(item.getCode()))
                .collect(Collectors.toList());
        }

        // Save/update items
        List<FilterCategoryItem> itemsToSaveOrUpdate = new ArrayList<>();
        for (FilterCategoryItem item : bobItemsToSave) {
            // If item has an ID (not null and > 0), it's an existing item (update)
            if (item.getId() != null && item.getId() > 0) {
                // Verify it's a BoB item
                FilterCategoryItem existingItem = existingBobByCode.get(item.getCode());
                if (existingItem != null) {
                    log.info("SERVICE: Updating existing BoB item: ID={}, Code={}, Description={}",
                        item.getId(), item.getCode(), item.getDescription());
                    itemsToSaveOrUpdate.add(item);
                } else {
                    log.warn("SERVICE: Item with ID {} and Code {} not found in existing BoB items, skipping",
                        item.getId(), item.getCode());
                }
            } else {
                // New item - check if code already exists
                if (existingBobByCode.containsKey(item.getCode())) {
                    log.warn("SERVICE: Cannot create new BoB - code {} already exists", item.getCode());
                    warnings.add("BoB code " + item.getCode() + " already exists");
                } else if (allExistingByCode.containsKey(item.getCode())) {
                    // Check if code exists in other categories
                    FilterCategoryItem conflicting = allExistingByCode.get(item.getCode());
                    log.warn("SERVICE: Cannot create new BoB - code {} exists in category {}",
                        item.getCode(), conflicting.getFilterCategoryCd());
                    warnings.add("Code " + item.getCode() + " already used in " + conflicting.getFilterCategoryCd());
                } else {
                    // Truly new item
                    item.setFilterCategoryCd("BoB");
                    itemsToSaveOrUpdate.add(item);
                    log.info("SERVICE: Creating new BoB item: Code={}, Description={}",
                        item.getCode(), item.getDescription());
                }
            }
        }

        if (!itemsToSaveOrUpdate.isEmpty()) {
            log.info("SERVICE: Saving {} items to database...", itemsToSaveOrUpdate.size());
            List<FilterCategoryItem> savedEntities = filterCategoryItemRepository.saveAll(itemsToSaveOrUpdate);
            log.info("SERVICE: Successfully saved {} BoB items to database", savedEntities.size());

            // Log each saved item for verification
            savedEntities.forEach(item ->
                log.info("SERVICE: Saved entity - ID: {}, Code: {}, Description: {}, Category: {}",
                    item.getId(), item.getCode(), item.getDescription(), item.getFilterCategoryCd())
            );
        } else {
            log.warn("SERVICE: No items to save or update!");
        }

        // Return updated BoB items with any warnings
        log.info("SERVICE: Fetching all BoB items from database for response...");
        List<FilterCategoryItem> allBobItems = filterCategoryItemRepository.findByFilterCategoryCd("BoB");
        log.info("SERVICE: Retrieved {} BoB items from database after save", allBobItems.size());

        List<FilterItemVO> savedItems = allBobItems.stream()
            .map(item -> {
                FilterItemVO vo = new FilterItemVO(item.getId(), item.getDescription(), item.getCode(), item.getFilterCategoryCd());
                log.info("SERVICE: Converting to VO - ID: {}, Code: {}, Description: {}",
                    item.getId(), item.getCode(), item.getDescription());
                return vo;
            })
            .collect(Collectors.toList());

        log.info("SERVICE: Returning {} BoB items, warnings: {}", savedItems.size(), warnings);
        log.info("========== SERVICE: saveBoBItems completed ==========");
        return new SaveBoBItemsResponse(savedItems, warnings, !warnings.isEmpty());
    }

    @Transactional
    public DeleteBoBItemResponse deleteBoBItem(String code) {
        log.info("========== SERVICE: deleteBoBItem started ==========");
        log.info("SERVICE: Attempting to delete BoB item with code: {}", JsonSanitizer.sanitize(code));

        // Check if the BoB code exists
        List<FilterCategoryItem> bobItems = filterCategoryItemRepository.findByFilterCategoryCd("BoB");
        FilterCategoryItem itemToDelete = bobItems.stream()
            .filter(item -> item.getCode().equals(code))
            .findFirst()
            .orElse(null);

        if (itemToDelete == null) {
            log.warn("SERVICE: BoB item not found with code: {}", JsonSanitizer.sanitize(code));
            return new DeleteBoBItemResponse(false, "BoB item not found", code, false, null);
        }

        // Check if the BoB code is tied to any campaign (via FilterEntry)
        boolean isInUse = filterEntryRepository.existsByValueAndFilterRuleFilterCategoryCd(code, "BoB");

        if (isInUse) {
            log.warn("SERVICE: Cannot delete BoB item {} - it is tied to one or more campaigns", JsonSanitizer.sanitize(code));

            // Fetch all FilterEntry records for this BoB code
            List<FilterEntry> linkedFilterEntries = filterEntryRepository.findByValueAndFilterRuleFilterCategoryCd(code, "BoB");

            // Extract unique menu entity IDs
            List<Long> menuEntityIds = linkedFilterEntries.stream()
                .map(fe -> fe.getFilterRule().getMenuEntityId())
                .distinct()
                .toList();

            log.info("SERVICE: Found {} campaigns linked to BoB code: {}", menuEntityIds.size(), JsonSanitizer.sanitize(code));

            // Fetch campaign names from MenuEntity
            List<String> campaignNames = new java.util.ArrayList<>();
            for (Long menuId : menuEntityIds) {
                MenuEntity menuEntity = menuEntityRepository.getByMenuEntityId(menuId);
                if (menuEntity != null) {
                    String campaignName = menuEntity.getCampaignName() != null
                        ? menuEntity.getCampaignName()
                        : menuEntity.getName();
                    campaignNames.add(campaignName);
                    log.info("SERVICE: Linked campaign: {} (menuId: {})", JsonSanitizer.sanitize(campaignName), menuId);
                }
            }

            return new DeleteBoBItemResponse(false,
                "Cannot delete BoB '" + itemToDelete.getDescription() + "' (" + code + ") because it is tied to one or more campaigns. " +
                "Please remove it from all campaigns first.",
                code, true, campaignNames);
        }

        // Safe to delete
        filterCategoryItemRepository.delete(itemToDelete);
        log.info("SERVICE: Successfully deleted BoB item with code: {}", JsonSanitizer.sanitize(code));

        log.info("========== SERVICE: deleteBoBItem completed successfully ==========");
        return new DeleteBoBItemResponse(true, "BoB item deleted successfully", code, false, null);
    }

    public Boolean validateUserRole(final List<String> roles) {
        final List<String> lineOfBusinessList = roleService.checkAdminLobs(roles);

        return true;
    }

    public Boolean validateUserRole(final List<String> roles, final Long clientContextId) {
        Boolean isValidRole = false;
        final ClientContext clientContext = retrieveClientContextByRoles().stream()
                .filter(t -> t.getClientContextId() == clientContextId)
                .findAny().orElse(null);
        if(clientContext != null) {
            isValidRole = true;
        }
        return true;
    }

    public Boolean validateUserRoleRemove(final List<String> roles, final long campaignId) {
        Boolean isValidRole = false;
        final MenuEntity menuEntity = menuEntityRepository.getByMenuEntityId(campaignId);
        final ClientContext clientContext = retrieveClientContextByRoles().stream()
                .filter(t -> t.getClientContextId() == menuEntity.getClientContextList().get(0).getClientContextId())
                .findAny().orElse(null);
        if(clientContext != null) {
            isValidRole = true;
        }
        return isValidRole;
    }

  public List<CampaignVO> menuEntityToCampaignVOList(final List<MenuEntity> menuEntities) {
    List<CampaignVO> campaignList = menuEntities.stream()
        .map(me -> new CampaignVO(
            me.getClientContextList().get(0).getClientContextId(),
            me.getMenuEntityId(),
            me.getName(),
            me.getCampaignName(),
            extractUrlLinkEmail(me.getNotificationTemplateList()),
            extractUrlLinkSMS(me.getNotificationTemplateList()),
            extractUrlLabel(me.getNotificationTemplateList()),
            me.getCampaign().getCampaignId(),
            extractTemplateTypes(me.getNotificationTemplateList()),
            isNonStandard(me.getNotificationTemplateList()),
            extractStandardTemplateId(me.getNotificationTemplateList()),
            me.getSubjectLine(),
            me.getDisclaimer(),
            extractStandardTemplateDefaultDisclaimer(me.getNotificationTemplateList()),
            extractSenderEmail(me)
        ))
        .collect(Collectors.toList());
    mapCampaignFilters(campaignList);
    return campaignList;
  }

  private void mapCampaignFilters(final List<CampaignVO> campaignList) {
    if (campaignList == null || campaignList.isEmpty()) return;

    // Map campaigns by menu ID for quick lookup
    Map<Long, CampaignVO> campaignMapByMenuId = campaignList.stream()
        .collect(Collectors.toMap(CampaignVO::getMenuId, Function.identity()));

    Set<Long> menuIds = campaignMapByMenuId.keySet();

    // Load only filter entries related to these menuIds
    List<FilterEntry> filterEntries = filterEntryRepository.findByFilterRuleMenuEntityIdIn(menuIds);

    // Load all filter categories and filter items once
    List<FilterCategory> filterCategories = filterCategoryRepository.findAll();
    List<FilterItemVO> filterItems = getFilterCategoryItems();

    // Map filter category codes to names
    Map<String, String> filterCategoryNameByCode = filterCategories.stream()
        .collect(Collectors.toMap(FilterCategory::getFilterCategoryCd, FilterCategory::getFilterCategoryName));

    // Map filter item codes to descriptions for faster lookup
    Map<String, String> filterItemDescriptionByCode = filterItems.stream()
        .collect(Collectors.toMap(FilterItemVO::getCode, FilterItemVO::getDescription));

    filterEntries.sort(Comparator.comparingLong(FilterEntry::getFilterEntryId).reversed());
    // Process each filter entry
    for (FilterEntry fe : filterEntries) {
      FilterRule rule = fe.getFilterRule();
      if (rule == null) continue;

      CampaignVO campaignVO = campaignMapByMenuId.get(rule.getMenuEntityId());
      if (campaignVO == null) continue;

      String filterCategoryCd = rule.getFilterCategoryCd();
      String filterCategoryName = filterCategoryNameByCode.getOrDefault(filterCategoryCd, "");
      String filterItemDescription = filterItemDescriptionByCode.getOrDefault(fe.getValue(), "");

      campaignVO.addCampaignFilterVO(new CampaignFilterVO(
          fe.getFilterEntryId(),
          filterCategoryName,
          filterCategoryCd,
          rule.getFilterType(),
          fe.getValue(),
          filterItemDescription,
          false // Default to false, can be updated later if needed
      ));
    }
  }


  private String getFilterItemDescription(String code, List<FilterItemVO> filterItems) {
        for (FilterItemVO filterItem : filterItems) {
            if (code.equalsIgnoreCase(filterItem.getCode())) {
                return filterItem.getDescription();
            }
        }
        return "";
    }

    private String extractUrlLinkEmail(final List<NotificationTemplate> templates) {
      if (templates.isEmpty()) {
        return "";
      }
      NotificationTemplate template = templates.stream().filter(t -> t.getTemplateType().getTemplateTypeValue().equalsIgnoreCase(NotifTemplateType.EMAIL.toString())).findFirst().orElse(null);
      if (Objects.nonNull(template)) {
        if (new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(template.getTemplateParams())).isJsonObject()) {
          JsonObject json = new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(template.getTemplateParams())).getAsJsonObject();
          return json.has("msg_parameters") ? json.getAsJsonObject("msg_parameters").getAsJsonObject("template").get("urlLink").getAsString() : "";
        }
      }
      return "";
    }

    private String extractUrlLinkSMS(final List<NotificationTemplate> templates) {
      if (templates.isEmpty()) {
        return "";
      }
      NotificationTemplate template = templates.stream().filter(t -> t.getTemplateType().getTemplateTypeValue().equalsIgnoreCase(NotifTemplateType.SMS.toString())).findFirst().orElse(null);
      if (Objects.nonNull(template)) {
        if (new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(template.getTemplateParams())).isJsonObject()) {
          JsonObject json = new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(template.getTemplateParams())).getAsJsonObject();
          return json.has("msg_parameters") ? json.getAsJsonObject("msg_parameters").getAsJsonObject("template").get("urlLink").getAsString() : "";
        }
      }
      return "";
    }

    private String extractUrlLabel(final List<NotificationTemplate> templates) {
        if (templates.isEmpty()) {
            return "";
        }
        NotificationTemplate urlLabelTemplate = templates.stream().filter(t -> t.getTemplateParams().contains("urlLabel")).findFirst().orElse(new NotificationTemplate());
        if (urlLabelTemplate.getTemplateParams() != null) {
            if (new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(urlLabelTemplate.getTemplateParams())).isJsonObject()) {
                JsonObject json = new JsonParser().parse(TemplateParamsUtils.cleanTemplateParams(urlLabelTemplate.getTemplateParams())).getAsJsonObject();
                return json.has("msg_parameters") ? json.getAsJsonObject("msg_parameters").getAsJsonObject("template").get("urlLabel").getAsString() : "";
            }
        }
        return "";
    }

    private List<String> extractTemplateTypes(final List<NotificationTemplate> templates) {
        List<String> templateTypes = Collections.synchronizedList(new ArrayList<>());
        if (templates.isEmpty()) {
            return templateTypes;
        }
        templates.forEach(t -> templateTypes.add(t.getTemplateType() != null ? t.getTemplateType().getTemplateTypeValue() : ""));
        return templateTypes;
    }

    private boolean isNonStandard(final List<NotificationTemplate> templates) {
        if (templates.isEmpty()) {
            return true;
        }
        Optional<NotificationTemplate> template = templates.stream().findFirst();
        if (template.get().getStandardTemplate() == null) {
            return true;//no details for non standard
        }
        StandardTemplate standardTemplate = standardTemplateRepository.findById(template.get().getStandardTemplate().getStandardTemplateId()).get();
        return standardTemplate == null ? true : false;
    }

    private Long extractStandardTemplateId(final List<NotificationTemplate> templates) {
        if (templates.isEmpty()) {
            return  null;
        }
        Optional<NotificationTemplate> template = templates.stream().findFirst();
        if (template.get().getStandardTemplate() == null) {
            return null;
        }
        StandardTemplate standardTemplate = standardTemplateRepository.findById(template.get().getStandardTemplate().getStandardTemplateId()).get();
        return standardTemplate == null ? null : standardTemplate.getStandardTemplateId();
    }

    private String extractStandardTemplateDefaultDisclaimer(final List<NotificationTemplate> templates) {
      if (templates.isEmpty()) {
        return null;
      }
      Optional<NotificationTemplate> template = templates.stream()
          .filter(t -> t.getStandardTemplate() != null && t.getStandardTemplate().getStandardTemplateId().equals(12L))
          .findFirst();
      if (template.isEmpty() || template.get().getStandardTemplate() == null) {
        return null;
      }
      StandardTemplate standardTemplate = standardTemplateRepository.findById(template.get().getStandardTemplate().getStandardTemplateId()).get();
      return standardTemplate == null ? null : standardTemplate.getDefaultDisclaimer();
    }

  @Transactional
  public MenuEntity updateTitleAndDescription(long menuEntityId, String title, String description) {
    MenuEntity menuEntity = menuEntityRepository.getByMenuEntityId(menuEntityId);
    if (menuEntity == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "MenuEntity not found with ID: " + menuEntityId);
    }
    menuEntity.setTitle(title);
    menuEntity.setDescription(description);
    return menuEntityRepository.save(menuEntity);
  }

  private String extractSenderEmail(MenuEntity me) {
    return Optional.ofNullable(me)
        .map(MenuEntity::getSenderEmail)
        .orElse(null);
  }

  // ==================== PROGRAM ID (SMS Manager Setting) Methods ====================

  /**
   * Retrieve all Program IDs from sms_manager_setting table
   */
  public List<ProgramIdVO> getProgramIds() {
      log.info("========== SERVICE: getProgramIds started ==========");
      List<SmsManagerSetting> programSettings = smsManagerSettingRepository.findAllByOrderByProgramIdAsc();
      log.info("SERVICE: Retrieved {} program IDs from database", programSettings.size());

      List<ProgramIdVO> result = programSettings.stream()
          .map(setting -> {
              // Fetch the Program ID Description from campaign table via junction table (read-only)
              String programIdDescription = smsManagerSettingRepository.getProgramIdDescription(setting.getSettingId());

              return new ProgramIdVO(
                  setting.getSettingId(),
                  programIdDescription != null ? programIdDescription : "",  // Description from campaign.name
                  setting.getProgramId(),         // program_id
                  setting.getOauthClientId(),     // oauth_client_id
                  setting.getEpmpProgramFlag(),   // epmp_program_flag
                  setting.getEpmpCategory()       // epmp_category
              );
          })
          .collect(Collectors.toList());

      log.info("========== SERVICE: getProgramIds completed ==========");
      return result;
  }

  /**
   * Save/Update Program IDs (SMS Manager Settings)
   * For new Program IDs with descriptions: creates Campaign entry and links via junction table
   */
  @Transactional
  public SaveProgramIdsResponse saveProgramIds(List<com.optum.riptide.ezcommui.adminui.valueobjects.request.SaveProgramIdsRequest.ProgramIdDto> programIdDtos) {
      log.info("========== SERVICE: saveProgramIds started ==========");
      log.info("SERVICE: Saving Program ID items, count: {}", programIdDtos.size());

      // Log each DTO for debugging
      for (int i = 0; i < programIdDtos.size(); i++) {
          com.optum.riptide.ezcommui.adminui.valueobjects.request.SaveProgramIdsRequest.ProgramIdDto dto = programIdDtos.get(i);
          log.info("SERVICE: DTO[{}] - SettingId={}, ProgramId='{}', Description='{}', ClientId='{}'",
              i, dto.getSettingId(), dto.getProgramId(), dto.getProgramIdDescription(), dto.getOauthClientId());
      }

      List<String> warnings = new ArrayList<>();

      for (com.optum.riptide.ezcommui.adminui.valueobjects.request.SaveProgramIdsRequest.ProgramIdDto dto : programIdDtos) {
          boolean isNewItem = (dto.getSettingId() == null || dto.getSettingId() == 0);

          if (isNewItem) {
              log.info("SERVICE: Creating new Program ID: {}, Description: {}",
                  dto.getProgramId(), dto.getProgramIdDescription());

              // 1. Create SmsManagerSetting entry
              SmsManagerSetting smsManagerSetting = new SmsManagerSetting();
              smsManagerSetting.setProgramId(dto.getProgramId());
              smsManagerSetting.setOauthClientId(dto.getOauthClientId());
              smsManagerSetting.setEpmpProgramFlag(dto.getEpmpProgramFlag());
              smsManagerSetting.setEpmpCategory(dto.getEpmpCategory());
              SmsManagerSetting savedSmsManagerSetting = smsManagerSettingRepository.save(smsManagerSetting);
              log.info("SERVICE: Saved SmsManagerSetting with ID: {}", savedSmsManagerSetting.getSettingId());

              // 2. Create Campaign entry if description is provided
              if (dto.getProgramIdDescription() != null && !dto.getProgramIdDescription().trim().isEmpty()) {
                  Campaign campaign = new Campaign();
                  campaign.setName(dto.getProgramIdDescription());  // Description stored as campaign.name
                  campaign.setLob("EPMP");  // Line of Business
                  campaign.setActiveStatus(true);
                  campaign.setCreated(new Timestamp(System.currentTimeMillis()));
                  campaign.setModified(new Timestamp(System.currentTimeMillis()));
                  Campaign savedCampaign = campaignRepository.save(campaign);
                  log.info("SERVICE: Created Campaign with ID: {}, Name: {}",
                      savedCampaign.getCampaignId(), savedCampaign.getName());

                  // 3. Link Campaign to SmsManagerSetting via junction table
                  CampaignToSmsManagerSetting junction = new CampaignToSmsManagerSetting(
                      savedCampaign.getCampaignId(),  // Already Integer
                      savedSmsManagerSetting.getSettingId().intValue(),  // Convert Long to Integer
                      "defaultPreference"  // usage_type
                  );
                  campaignToSmsManagerSettingRepository.save(junction);
                  log.info("SERVICE: Created junction entry linking Campaign {} to SmsManagerSetting {}",
                      savedCampaign.getCampaignId(), savedSmsManagerSetting.getSettingId());

                  // 4. Create EmailSetting entry if sender name or email is provided
                  if ((dto.getSenderName() != null && !dto.getSenderName().trim().isEmpty()) ||
                      (dto.getSenderEmail() != null && !dto.getSenderEmail().trim().isEmpty())) {
                      EmailSetting emailSetting = new EmailSetting();
                      emailSetting.setSenderName(dto.getSenderName());
                      emailSetting.setSenderEmailAddress(dto.getSenderEmail());
                      EmailSetting savedEmailSetting = emailSettingRepository.save(emailSetting);
                      log.info("SERVICE: Created EmailSetting with ID: {}, SenderName: {}, SenderEmail: {}",
                          savedEmailSetting.getEmailSettingId(), savedEmailSetting.getSenderName(), savedEmailSetting.getSenderEmailAddress());

                      // 5. Link Campaign to EmailSetting via junction table
                      CampaignToEmailSetting emailJunction = new CampaignToEmailSetting();
                      emailJunction.setCampaignId(savedCampaign.getCampaignId());
                      emailJunction.setEmailSettingId(savedEmailSetting.getEmailSettingId());
                      campaignToEmailSettingRepository.save(emailJunction);
                      log.info("SERVICE: Created junction entry linking Campaign {} to EmailSetting {}",
                          savedCampaign.getCampaignId(), savedEmailSetting.getEmailSettingId());
                  }
              } else {
                  log.warn("SERVICE: No description provided for new Program ID {}, skipping Campaign creation",
                      dto.getProgramId());
              }

          } else {
              // Update existing Program ID
              log.info("SERVICE: Updating existing Program ID: ID={}, ProgramID={}",
                  dto.getSettingId(), dto.getProgramId());

              Optional<SmsManagerSetting> existingOpt = smsManagerSettingRepository.findById(dto.getSettingId());
              if (existingOpt.isPresent()) {
                  SmsManagerSetting existing = existingOpt.get();
                  existing.setProgramId(dto.getProgramId());
                  existing.setOauthClientId(dto.getOauthClientId());
                  existing.setEpmpProgramFlag(dto.getEpmpProgramFlag());
                  existing.setEpmpCategory(dto.getEpmpCategory());
                  smsManagerSettingRepository.save(existing);

                  // Update Campaign description if provided and junction exists
                  if (dto.getProgramIdDescription() != null && !dto.getProgramIdDescription().trim().isEmpty()) {
                      log.info("SERVICE: Looking for campaigns linked to settingId: {}", dto.getSettingId());

                      // Note: One SMS Manager Setting can be linked to multiple campaigns
                      List<CampaignToSmsManagerSetting> junctions =
                          campaignToSmsManagerSettingRepository.findBySmsManagerSettingId(dto.getSettingId());

                      log.info("SERVICE: Found {} campaign(s) linked to settingId: {}",
                          junctions.size(), dto.getSettingId());

                      if (!junctions.isEmpty()) {
                          // Update the first campaign found (primary campaign for this program ID)
                          Integer campaignId = junctions.get(0).getCampaignId();
                          log.info("SERVICE: Will update Campaign ID: {} with new description: '{}'",
                              campaignId, dto.getProgramIdDescription());

                          Optional<Campaign> campaignOpt = campaignRepository.findById(campaignId);
                          if (campaignOpt.isPresent()) {
                              Campaign campaign = campaignOpt.get();
                              String oldDescription = campaign.getName();
                              campaign.setName(dto.getProgramIdDescription());
                              campaign.setModified(new Timestamp(System.currentTimeMillis()));
                              campaignRepository.save(campaign);
                              log.info("SERVICE: Successfully updated Campaign ID: {}, Description: '{}' -> '{}'",
                                  campaignId, oldDescription, dto.getProgramIdDescription());

                              // Update or Create EmailSetting for this campaign
                              if ((dto.getSenderName() != null && !dto.getSenderName().trim().isEmpty()) ||
                                  (dto.getSenderEmail() != null && !dto.getSenderEmail().trim().isEmpty())) {

                                  // Check if email setting already exists for this campaign
                                  Optional<Long> existingEmailSettingIdOpt = campaignToEmailSettingRepository.findEmailSettingIdByCampaignId(campaignId);

                                  if (existingEmailSettingIdOpt.isPresent()) {
                                      // Update existing EmailSetting
                                      Optional<EmailSetting> emailSettingOpt = emailSettingRepository.findById(existingEmailSettingIdOpt.get());
                                      if (emailSettingOpt.isPresent()) {
                                          EmailSetting emailSetting = emailSettingOpt.get();
                                          emailSetting.setSenderName(dto.getSenderName());
                                          emailSetting.setSenderEmailAddress(dto.getSenderEmail());
                                          emailSettingRepository.save(emailSetting);
                                          log.info("SERVICE: Updated EmailSetting ID: {} with SenderName: {}, SenderEmail: {}",
                                              emailSetting.getEmailSettingId(), dto.getSenderName(), dto.getSenderEmail());
                                      }
                                  } else {
                                      // Create new EmailSetting and link to campaign
                                      EmailSetting newEmailSetting = new EmailSetting();
                                      newEmailSetting.setSenderName(dto.getSenderName());
                                      newEmailSetting.setSenderEmailAddress(dto.getSenderEmail());
                                      EmailSetting savedEmailSetting = emailSettingRepository.save(newEmailSetting);
                                      log.info("SERVICE: Created new EmailSetting with ID: {}", savedEmailSetting.getEmailSettingId());

                                      // Link to campaign
                                      CampaignToEmailSetting emailJunction = new CampaignToEmailSetting();
                                      emailJunction.setCampaignId(campaignId);
                                      emailJunction.setEmailSettingId(savedEmailSetting.getEmailSettingId());
                                      campaignToEmailSettingRepository.save(emailJunction);
                                      log.info("SERVICE: Created junction linking Campaign {} to EmailSetting {}",
                                          campaignId, savedEmailSetting.getEmailSettingId());
                                  }
                              }
                          } else {
                              log.warn("SERVICE: Campaign ID {} not found in database", campaignId);
                          }
                      } else {
                          log.warn("SERVICE: No campaigns found linked to settingId: {}. Cannot update description.",
                              dto.getSettingId());
                      }
                  }
              } else {
                  log.warn("SERVICE: Program ID with ID {} not found, skipping", dto.getSettingId());
                  warnings.add("Program ID with ID " + dto.getSettingId() + " not found");
              }
          }
      }

      // Return updated Program IDs with descriptions
      log.info("SERVICE: Fetching all Program IDs from database for response...");
      List<SmsManagerSetting> allPrograms = smsManagerSettingRepository.findAllByOrderByProgramIdAsc();
      log.info("SERVICE: Retrieved {} Program IDs from database after save", allPrograms.size());

      List<ProgramIdVO> savedItems = allPrograms.stream()
          .map(item -> {
              // Fetch the Program ID Description from campaign table via junction table
              String programIdDescription = smsManagerSettingRepository.getProgramIdDescription(item.getSettingId());

              return new ProgramIdVO(
                  item.getSettingId(),
                  programIdDescription != null ? programIdDescription : "",  // Description from campaign.name
                  item.getProgramId(),            // program_id
                  item.getOauthClientId(),        // oauth_client_id
                  item.getEpmpProgramFlag(),      // epmp_program_flag
                  item.getEpmpCategory()          // epmp_category
              );
          })
          .collect(Collectors.toList());

      log.info("SERVICE: Returning {} Program ID items, warnings: {}", savedItems.size(), warnings);
      log.info("========== SERVICE: saveProgramIds completed ==========");
      return new SaveProgramIdsResponse(savedItems, warnings, !warnings.isEmpty());
  }

  @Transactional
  public DeleteProgramIdResponse deleteProgramId(Long settingId) {
      log.info("========== SERVICE: deleteProgramId started ==========");
      log.info("SERVICE: Attempting to delete Program ID with settingId: {}", settingId);

      // Check if the Program ID exists in sms_manager_setting table
      Optional<SmsManagerSetting> smsManagerSettingOpt = smsManagerSettingRepository.findById(settingId);

      if (!smsManagerSettingOpt.isPresent()) {
          log.warn("SERVICE: Program ID not found with settingId: {}", settingId);
          return new DeleteProgramIdResponse(false, "Program ID not found", settingId, false, null);
      }

      SmsManagerSetting smsManagerSetting = smsManagerSettingOpt.get();
      String programId = smsManagerSetting.getProgramId();

      log.info("SERVICE: Found Program ID: {}", programId);

      // Check if the Program ID is tied to any campaigns via campaign_to_sms_manager_setting
      List<CampaignToSmsManagerSetting> junctions =
          campaignToSmsManagerSettingRepository.findBySmsManagerSettingId(settingId);

      if (!junctions.isEmpty()) {
          log.info("SERVICE: Found {} junction(s) for Program ID {}", junctions.size(), programId);

          // Check if any of these campaigns are ACTUALLY used by menu_entity (real user-facing campaigns)
          List<String> linkedCampaignNames = new ArrayList<>();

          for (CampaignToSmsManagerSetting junction : junctions) {
              Integer campaignId = junction.getCampaignId();
              // Find menu entities that reference this campaign
              List<MenuEntity> menuEntities = menuEntityRepository.findByCampaign_CampaignId(campaignId);

              if (!menuEntities.isEmpty()) {
                  // This campaign is used by real menu entities - LOOP THROUGH ALL OF THEM!
                  log.info("SERVICE: Found {} menu_entity entries for campaign_id {}", menuEntities.size(), campaignId);

                  for (MenuEntity menuEntity : menuEntities) {
                      String campaignName = menuEntity.getCampaignName();
                      String displayName = (campaignName != null && !campaignName.isEmpty())
                          ? campaignName
                          : menuEntity.getName();

                      // Avoid duplicate names in the list
                      if (!linkedCampaignNames.contains(displayName)) {
                          linkedCampaignNames.add(displayName);
                          log.info("SERVICE: Added linked campaign: {} (menu_entity_id: {})", displayName, menuEntity.getMenuEntityId());
                      }
                  }
              } else {
                  // No menu_entity found - this campaign is NOT used by any real user-facing campaign
                  log.info("SERVICE: Campaign ID {} has no menu_entity - not a real campaign, will allow deletion", campaignId);
              }
          }

          // Only block deletion if there are REAL campaigns (with menu_entity)
          if (!linkedCampaignNames.isEmpty()) {
              log.warn("SERVICE: Cannot delete Program ID {} - it is tied to {} REAL campaign(s) with menu_entity",
                  programId, linkedCampaignNames.size());

              String message = "Cannot delete Program ID '" + programId + "' because it is tied to " +
                              linkedCampaignNames.size() + " campaign(s). Please remove it from all campaigns first.";

              return new DeleteProgramIdResponse(false, message, settingId, true, linkedCampaignNames);
          }

          // If we get here, there are junctions but NO real campaigns (no menu_entity)
          // This means the Program ID was created but never used - safe to delete
          log.info("SERVICE: No real campaigns found (no menu_entity), proceeding with deletion");
      }

      // Safe to delete - no campaigns are using this Program ID
      // First delete the Campaign entry (if exists) that was created for this Program ID
      List<CampaignToSmsManagerSetting> allJunctions =
          campaignToSmsManagerSettingRepository.findBySmsManagerSettingId(settingId);

      if (!allJunctions.isEmpty()) {
          log.info("SERVICE: Found {} junction entries for settingId: {}", allJunctions.size(), settingId);

          for (CampaignToSmsManagerSetting junction : allJunctions) {
              Integer campaignId = junction.getCampaignId();
              log.info("SERVICE: Deleting junction entry and campaign for campaignId: {}", campaignId);

              // Delete junction (campaign_to_sms_manager_setting)
              campaignToSmsManagerSettingRepository.delete(junction);

              // Delete campaign_to_email_setting rows AND email_setting rows for this campaign
              List<CampaignToEmailSetting> emailJunctions = campaignToEmailSettingRepository.findByCampaignId(campaignId);
              if (emailJunctions != null && !emailJunctions.isEmpty()) {
                  for (CampaignToEmailSetting emailJunction : emailJunctions) {
                      Long emailSettingId = emailJunction.getEmailSettingId();
                      
                      // Delete the junction first
                      campaignToEmailSettingRepository.delete(emailJunction);
                      log.info("SERVICE: Deleted campaign_to_email_setting for campaignId: {}, emailSettingId: {}", 
                          campaignId, emailSettingId);
                      
                      // Delete the actual email_setting entry
                      if (emailSettingId != null) {
                          Optional<EmailSetting> emailSettingOpt = emailSettingRepository.findById(emailSettingId);
                          if (emailSettingOpt.isPresent()) {
                              emailSettingRepository.delete(emailSettingOpt.get());
                              log.info("SERVICE: Deleted email_setting with ID: {}", emailSettingId);
                          }
                      }
                  }
              }

              // Delete campaign if it exists
              Optional<Campaign> campaignOpt = campaignRepository.findById(campaignId);
              if (campaignOpt.isPresent()) {
                  campaignRepository.delete(campaignOpt.get());
                  log.info("SERVICE: Deleted campaign with ID: {}", campaignId);
              }
          }
      }

      // Finally, delete the SmsManagerSetting entry
      smsManagerSettingRepository.delete(smsManagerSetting);
      log.info("SERVICE: Successfully deleted Program ID with settingId: {}", settingId);

      log.info("========== SERVICE: deleteProgramId completed successfully ==========");
      return new DeleteProgramIdResponse(true, "Program ID deleted successfully", settingId, false, null);
  }
}
