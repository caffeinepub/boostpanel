import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  // Initialize access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // User Profile Type
  public type UserProfile = {
    username : Text;
    email : Text;
    balance : Float.Float;
    accountStatus : AccountStatus;
    apiKey : Text;
  };

  type AccountStatus = {
    #active;
    #suspended;
  };

  type Category = {
    id : Nat;
    name : Text;
    description : Text;
  };

  module Category {
    public func compare(category1 : Category, category2 : Category) : Order.Order {
      Nat.compare(category1.id, category2.id);
    };
  };

  type Service = {
    id : Nat;
    categoryId : Nat;
    name : Text;
    description : Text;
    pricePerThousand : Float.Float;
    minQuantity : Nat;
    maxQuantity : Nat;
    isActive : Bool;
  };

  module Service {
    public func compare(service1 : Service, service2 : Service) : Order.Order {
      Nat.compare(service1.id, service2.id);
    };
  };

  type OrderRecord = {
    id : Nat;
    userId : Principal;
    serviceId : Nat;
    serviceName : Text;
    link : Text;
    quantity : Nat;
    cost : Float.Float;
    status : OrderStatus;
    createdAt : Nat;
  };

  module OrderRecord {
    public func compare(order1 : OrderRecord, order2 : OrderRecord) : Order.Order {
      Nat.compare(order1.id, order2.id);
    };
  };

  type PaymentRequest = {
    id : Nat;
    userId : Principal;
    screenshotBlobId : Text;
    utrNumber : Text;
    amount : Float.Float;
    status : PaymentStatus;
    adminNote : Text;
    createdAt : Nat;
  };

  module PaymentRequest {
    public func compare(paymentRequest1 : PaymentRequest, paymentRequest2 : PaymentRequest) : Order.Order {
      Nat.compare(paymentRequest1.id, paymentRequest2.id);
    };
  };

  type Transaction = {
    id : Nat;
    userId : Principal;
    transactionType : TransactionType;
    amount : Float.Float;
    description : Text;
    createdAt : Nat;
    referenceId : Text;
  };

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Nat.compare(transaction1.id, transaction2.id);
    };
  };

  type TransactionType = {
    #credit;
    #debit;
  };

  type PaymentStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type OrderStatus = {
    #pending;
    #processing;
    #completed;
    #cancelled;
  };

  type DashboardStats = {
    totalUsers : Nat;
    totalOrders : Nat;
    totalRevenue : Float.Float;
    pendingPayments : Nat;
  };

  // State
  let userProfiles = Map.empty<Principal, UserProfile>();
  let categories = Map.empty<Nat, Category>();
  let services = Map.empty<Nat, Service>();
  let orders = Map.empty<Nat, OrderRecord>();
  let paymentRequests = Map.empty<Nat, PaymentRequest>();
  let transactions = Map.empty<Nat, Transaction>();

  var nextCategoryId : Nat = 1;
  var nextServiceId : Nat = 1;
  var nextOrderId : Nat = 1;
  var nextPaymentRequestId : Nat = 1;
  var nextTransactionId : Nat = 1;

  // ============ USER PROFILE MANAGEMENT ============

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ============ CATEGORY MANAGEMENT (Admin Only) ============

  public shared ({ caller }) func createCategory(name : Text, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create categories");
    };
    let id = nextCategoryId;
    nextCategoryId += 1;
    let category : Category = {
      id = id;
      name = name;
      description = description;
    };
    categories.add(id, category);
    id;
  };

  public shared ({ caller }) func updateCategory(id : Nat, name : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update categories");
    };
    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?existing) {
        let updated : Category = {
          id = id;
          name = name;
          description = description;
        };
        categories.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete categories");
    };
    categories.remove(id);
  };

  public query func getAllCategories() : async [Category] {
    categories.values().toArray().sort();
  };

  // ============ SERVICE MANAGEMENT ============

  public shared ({ caller }) func createService(
    categoryId : Nat,
    name : Text,
    description : Text,
    pricePerThousand : Float.Float,
    minQuantity : Nat,
    maxQuantity : Nat,
    isActive : Bool,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create services");
    };
    let id = nextServiceId;
    nextServiceId += 1;
    let service : Service = {
      id = id;
      categoryId = categoryId;
      name = name;
      description = description;
      pricePerThousand = pricePerThousand;
      minQuantity = minQuantity;
      maxQuantity = maxQuantity;
      isActive = isActive;
    };
    services.add(id, service);
    id;
  };

  public shared ({ caller }) func updateService(
    id : Nat,
    categoryId : Nat,
    name : Text,
    description : Text,
    pricePerThousand : Float.Float,
    minQuantity : Nat,
    maxQuantity : Nat,
    isActive : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update services");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?existing) {
        let updated : Service = {
          id = id;
          categoryId = categoryId;
          name = name;
          description = description;
          pricePerThousand = pricePerThousand;
          minQuantity = minQuantity;
          maxQuantity = maxQuantity;
          isActive = isActive;
        };
        services.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteService(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete services");
    };
    services.remove(id);
  };

  public shared ({ caller }) func updateServiceActiveStatus(id : Nat, isActive : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update service status");
    };
    switch (services.get(id)) {
      case (null) { Runtime.trap("Service not found") };
      case (?existing) {
        let updated : Service = {
          id = existing.id;
          categoryId = existing.categoryId;
          name = existing.name;
          description = existing.description;
          pricePerThousand = existing.pricePerThousand;
          minQuantity = existing.minQuantity;
          maxQuantity = existing.maxQuantity;
          isActive = isActive;
        };
        services.add(id, updated);
      };
    };
  };

  public query func getAllServices() : async [Service] {
    services.values().toArray().filter(func(s) { s.isActive }).sort();
  };

  public query ({ caller }) func getAllServicesAdmin() : async [Service] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all services");
    };
    services.values().toArray().sort();
  };

  // ============ ORDER MANAGEMENT ============

  public shared ({ caller }) func placeOrder(
    serviceId : Nat,
    link : Text,
    quantity : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    // Get user profile
    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    // Check account status
    switch (userProfile.accountStatus) {
      case (#suspended) { Runtime.trap("Account is suspended") };
      case (#active) {};
    };

    // Get service
    let service = switch (services.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?s) { s };
    };

    // Validate service is active
    if (not service.isActive) {
      Runtime.trap("Service is not active");
    };

    // Validate quantity
    if (quantity < service.minQuantity or quantity > service.maxQuantity) {
      Runtime.trap("Invalid quantity");
    };

    // Calculate cost
    let cost = (quantity.toFloat() / 1000.0) * service.pricePerThousand;

    // Check balance
    if (userProfile.balance < cost) {
      Runtime.trap("Insufficient balance");
    };

    // Deduct balance
    let updatedProfile : UserProfile = {
      username = userProfile.username;
      email = userProfile.email;
      balance = userProfile.balance - cost;
      accountStatus = userProfile.accountStatus;
      apiKey = userProfile.apiKey;
    };
    userProfiles.add(caller, updatedProfile);

    // Create order
    let orderId = nextOrderId;
    nextOrderId += 1;
    let order : OrderRecord = {
      id = orderId;
      userId = caller;
      serviceId = serviceId;
      serviceName = service.name;
      link = link;
      quantity = quantity;
      cost = cost;
      status = #pending;
      createdAt = 0; // Should use Time.now() in production
    };
    orders.add(orderId, order);

    // Create transaction
    let transactionId = nextTransactionId;
    nextTransactionId += 1;
    let transaction : Transaction = {
      id = transactionId;
      userId = caller;
      transactionType = #debit;
      amount = cost;
      description = "Order #" # orderId.toText() # " - " # service.name;
      createdAt = 0;
      referenceId = orderId.toText();
    };
    transactions.add(transactionId, transaction);

    orderId;
  };

  public query ({ caller }) func getMyOrders() : async [OrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their orders");
    };
    orders.values().toArray().filter(func(o) { o.userId == caller }).sort();
  };

  public query ({ caller }) func getAllOrders() : async [OrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray().sort();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existing) {
        let updated : OrderRecord = {
          id = existing.id;
          userId = existing.userId;
          serviceId = existing.serviceId;
          serviceName = existing.serviceName;
          link = existing.link;
          quantity = existing.quantity;
          cost = existing.cost;
          status = status;
          createdAt = existing.createdAt;
        };
        orders.add(orderId, updated);
      };
    };
  };

  // ============ PAYMENT REQUEST MANAGEMENT ============

  public shared ({ caller }) func submitPaymentRequest(
    screenshotBlobId : Text,
    utrNumber : Text,
    amount : Float.Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit payment requests");
    };

    let id = nextPaymentRequestId;
    nextPaymentRequestId += 1;
    let paymentRequest : PaymentRequest = {
      id = id;
      userId = caller;
      screenshotBlobId = screenshotBlobId;
      utrNumber = utrNumber;
      amount = amount;
      status = #pending;
      adminNote = "";
      createdAt = 0;
    };
    paymentRequests.add(id, paymentRequest);
    id;
  };

  public query ({ caller }) func getMyPaymentRequests() : async [PaymentRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their payment requests");
    };
    paymentRequests.values().toArray().filter(func(p) { p.userId == caller }).sort();
  };

  public query ({ caller }) func getAllPaymentRequests() : async [PaymentRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all payment requests");
    };
    paymentRequests.values().toArray().sort();
  };

  public shared ({ caller }) func approvePayment(paymentRequestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve payments");
    };

    let paymentRequest = switch (paymentRequests.get(paymentRequestId)) {
      case (null) { Runtime.trap("Payment request not found") };
      case (?pr) { pr };
    };

    if (paymentRequest.status != #pending) {
      Runtime.trap("Payment request is not pending");
    };

    // Update payment request status
    let updatedPaymentRequest : PaymentRequest = {
      id = paymentRequest.id;
      userId = paymentRequest.userId;
      screenshotBlobId = paymentRequest.screenshotBlobId;
      utrNumber = paymentRequest.utrNumber;
      amount = paymentRequest.amount;
      status = #approved;
      adminNote = paymentRequest.adminNote;
      createdAt = paymentRequest.createdAt;
    };
    paymentRequests.add(paymentRequestId, updatedPaymentRequest);

    // Add balance to user
    let userProfile = switch (userProfiles.get(paymentRequest.userId)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    let updatedProfile : UserProfile = {
      username = userProfile.username;
      email = userProfile.email;
      balance = userProfile.balance + paymentRequest.amount;
      accountStatus = userProfile.accountStatus;
      apiKey = userProfile.apiKey;
    };
    userProfiles.add(paymentRequest.userId, updatedProfile);

    // Create transaction
    let transactionId = nextTransactionId;
    nextTransactionId += 1;
    let transaction : Transaction = {
      id = transactionId;
      userId = paymentRequest.userId;
      transactionType = #credit;
      amount = paymentRequest.amount;
      description = "Payment approved - UTR: " # paymentRequest.utrNumber;
      createdAt = 0;
      referenceId = paymentRequestId.toText();
    };
    transactions.add(transactionId, transaction);
  };

  public shared ({ caller }) func rejectPayment(paymentRequestId : Nat, adminNote : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject payments");
    };

    let paymentRequest = switch (paymentRequests.get(paymentRequestId)) {
      case (null) { Runtime.trap("Payment request not found") };
      case (?pr) { pr };
    };

    if (paymentRequest.status != #pending) {
      Runtime.trap("Payment request is not pending");
    };

    let updatedPaymentRequest : PaymentRequest = {
      id = paymentRequest.id;
      userId = paymentRequest.userId;
      screenshotBlobId = paymentRequest.screenshotBlobId;
      utrNumber = paymentRequest.utrNumber;
      amount = paymentRequest.amount;
      status = #rejected;
      adminNote = adminNote;
      createdAt = paymentRequest.createdAt;
    };
    paymentRequests.add(paymentRequestId, updatedPaymentRequest);
  };

  // ============ TRANSACTION HISTORY ============

  public query ({ caller }) func getMyTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their transactions");
    };
    transactions.values().toArray().filter(func(t) { t.userId == caller }).sort();
  };

  // ============ ADMIN FUNCTIONS ============

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.entries().toArray();
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard stats");
    };

    let totalUsers = userProfiles.size();
    let totalOrders = orders.size();

    var totalRevenue : Float.Float = 0.0;
    for (order in orders.values()) {
      totalRevenue += order.cost;
    };

    var pendingPayments : Nat = 0;
    for (pr in paymentRequests.values()) {
      switch (pr.status) {
        case (#pending) { pendingPayments += 1 };
        case (_) {};
      };
    };

    {
      totalUsers = totalUsers;
      totalOrders = totalOrders;
      totalRevenue = totalRevenue;
      pendingPayments = pendingPayments;
    };
  };
};
